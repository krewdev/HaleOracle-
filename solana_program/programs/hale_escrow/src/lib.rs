use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_instruction;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("BCKogk1bxSti471AAyrWu3fEBLtbrE3nrwopKZrauEu6");

#[program]
pub mod hale_escrow {
    use super::*;

    pub fn create_escrow(
        ctx: Context<CreateEscrow>,
        intent_hash: [u8; 32],
        amount: u64,
        is_spl: bool,
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        escrow.buyer = ctx.accounts.buyer.key();
        escrow.seller = ctx.accounts.seller.key();
        escrow.intent_hash = intent_hash;
        escrow.amount = amount;
        escrow.status = EscrowStatus::Draft;
        escrow.is_spl = is_spl;
        escrow.bump = ctx.bumps.escrow;

        msg!("Escrow created for intent: {:?}. SPL: {}", intent_hash, is_spl);
        Ok(())
    }

    pub fn deposit_sol(ctx: Context<DepositSol>) -> Result<()> {
        let amount = ctx.accounts.escrow.amount;
        require!(!ctx.accounts.escrow.is_spl, HaleError::AssetMismatch);

        let ix = system_instruction::transfer(
            &ctx.accounts.buyer.key(),
            &ctx.accounts.escrow.key(),
            amount,
        );
        anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                ctx.accounts.buyer.to_account_info(),
                ctx.accounts.escrow.to_account_info(),
            ],
        )?;

        let escrow = &mut ctx.accounts.escrow;
        escrow.status = EscrowStatus::Funded;
        msg!("Escrow funded with {} SOL (lamports)", amount);
        Ok(())
    }

    pub fn deposit_token(ctx: Context<DepositToken>) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        require!(escrow.is_spl, HaleError::AssetMismatch);

        let cpi_accounts = Transfer {
            from: ctx.accounts.buyer_token_account.to_account_info(),
            to: ctx.accounts.escrow_token_vault.to_account_info(),
            authority: ctx.accounts.buyer.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, escrow.amount)?;

        escrow.status = EscrowStatus::Funded;
        msg!("Escrow funded with {} tokens", escrow.amount);
        Ok(())
    }

    pub fn release(ctx: Context<Release>) -> Result<()> {
        let is_spl = ctx.accounts.escrow.is_spl;
        let amount = ctx.accounts.escrow.amount;
        let bump = ctx.accounts.escrow.bump;
        let buyer_key = ctx.accounts.escrow.buyer;
        let intent_hash = ctx.accounts.escrow.intent_hash;

        require!(ctx.accounts.escrow.status == EscrowStatus::Funded, HaleError::InvalidStatus);
        
        if is_spl {
            require!(
                anchor_spl::token::accessor::authority(&ctx.accounts.escrow_token_vault.to_account_info())? == ctx.accounts.escrow.key(),
                HaleError::Unauthorized
            );

            let seeds = &[
                b"escrow",
                buyer_key.as_ref(),
                intent_hash.as_ref(),
                &[bump],
            ];
            let signer = &[&seeds[..]];

            let cpi_accounts = Transfer {
                from: ctx.accounts.escrow_token_vault.to_account_info(),
                to: ctx.accounts.seller_token_account.to_account_info(),
                authority: ctx.accounts.escrow.to_account_info(),
            };
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
            token::transfer(cpi_ctx, amount)?;
        } else {
            **ctx.accounts.escrow.to_account_info().try_borrow_mut_lamports()? -= amount;
            **ctx.accounts.seller.to_account_info().try_borrow_mut_lamports()? += amount;
        }
        
        let escrow = &mut ctx.accounts.escrow;
        escrow.status = EscrowStatus::Released;
        msg!("Escrow released to seller: {:?}", ctx.accounts.seller.key());
        Ok(())
    }

    pub fn refund(ctx: Context<Refund>) -> Result<()> {
        let is_spl = ctx.accounts.escrow.is_spl;
        let amount = ctx.accounts.escrow.amount;
        let bump = ctx.accounts.escrow.bump;
        let buyer_key = ctx.accounts.escrow.buyer;
        let intent_hash = ctx.accounts.escrow.intent_hash;

        require!(ctx.accounts.escrow.status == EscrowStatus::Funded, HaleError::InvalidStatus);

        if is_spl {
            require!(
                anchor_spl::token::accessor::authority(&ctx.accounts.escrow_token_vault.to_account_info())? == ctx.accounts.escrow.key(),
                HaleError::Unauthorized
            );

            let seeds = &[
                b"escrow",
                buyer_key.as_ref(),
                intent_hash.as_ref(),
                &[bump],
            ];
            let signer = &[&seeds[..]];

            let cpi_accounts = Transfer {
                from: ctx.accounts.escrow_token_vault.to_account_info(),
                to: ctx.accounts.buyer_token_account.to_account_info(),
                authority: ctx.accounts.escrow.to_account_info(),
            };
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
            token::transfer(cpi_ctx, amount)?;
        } else {
            **ctx.accounts.escrow.to_account_info().try_borrow_mut_lamports()? -= amount;
            **ctx.accounts.buyer.to_account_info().try_borrow_mut_lamports()? += amount;
        }
        
        let escrow = &mut ctx.accounts.escrow;
        escrow.status = EscrowStatus::Refunded;
        msg!("Escrow refunded to buyer: {:?}", ctx.accounts.buyer.key());
        Ok(())
    }

    // Paymaster feature: Oracle can be compensated in USDC for gas/service
    pub fn pay_with_usdc(ctx: Context<PayWithUsdc>, fee_amount: u64) -> Result<()> {
        let cpi_accounts = Transfer {
            from: ctx.accounts.user_token_account.to_account_info(),
            to: ctx.accounts.paymaster_token_account.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, fee_amount)?;
        
        msg!("Paymaster fee of {} USDC received", fee_amount);
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(intent_hash: [u8; 32], amount: u64)]
pub struct CreateEscrow<'info> {
    #[account(
        init,
        payer = buyer,
        space = 8 + 32 + 32 + 32 + 8 + 1 + 1 + 1,
        seeds = [b"escrow", buyer.key().as_ref(), intent_hash.as_ref()],
        bump
    )]
    pub escrow: Account<'info, EscrowAccount>,
    #[account(mut)]
    pub buyer: Signer<'info>,
    /// CHECK: Target seller
    pub seller: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DepositSol<'info> {
    #[account(
        mut,
        has_one = buyer,
        seeds = [b"escrow", buyer.key().as_ref(), escrow.intent_hash.as_ref()],
        bump = escrow.bump,
    )]
    pub escrow: Account<'info, EscrowAccount>,
    #[account(mut)]
    pub buyer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DepositToken<'info> {
    #[account(
        mut,
        has_one = buyer,
        seeds = [b"escrow", buyer.key().as_ref(), escrow.intent_hash.as_ref()],
        bump = escrow.bump,
    )]
    pub escrow: Account<'info, EscrowAccount>,
    #[account(mut)]
    pub buyer_token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = escrow_token_vault.owner == escrow.key()
    )]
    pub escrow_token_vault: Account<'info, TokenAccount>,
    pub buyer: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Release<'info> {
    #[account(
        mut,
        has_one = seller,
        seeds = [b"escrow", escrow.buyer.as_ref(), escrow.intent_hash.as_ref()],
        bump = escrow.bump,
    )]
    pub escrow: Account<'info, EscrowAccount>,
    #[account(mut)]
    pub oracle: Signer<'info>,
    /// CHECK: Recipient of SOL
    #[account(mut)]
    pub seller: UncheckedAccount<'info>,
    /// CHECK: Validated in logic if is_spl is true
    #[account(mut)]
    pub seller_token_account: UncheckedAccount<'info>,
    /// CHECK: Validated in logic if is_spl is true
    #[account(mut)]
    pub escrow_token_vault: UncheckedAccount<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct PayWithUsdc<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub paymaster_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Refund<'info> {
    #[account(
        mut,
        has_one = buyer,
        seeds = [b"escrow", escrow.buyer.as_ref(), escrow.intent_hash.as_ref()],
        bump = escrow.bump,
    )]
    pub escrow: Account<'info, EscrowAccount>,
    #[account(mut)]
    pub oracle: Signer<'info>,
    /// CHECK: Recipient of SOL refund
    #[account(mut)]
    pub buyer: UncheckedAccount<'info>,
    /// CHECK: Validated in logic if is_spl is true
    #[account(mut)]
    pub buyer_token_account: UncheckedAccount<'info>,
    /// CHECK: Validated in logic if is_spl is true
    #[account(mut)]
    pub escrow_token_vault: UncheckedAccount<'info>,
    pub token_program: Program<'info, Token>,
}

#[account]
pub struct EscrowAccount {
    pub buyer: Pubkey,
    pub seller: Pubkey,
    pub intent_hash: [u8; 32],
    pub amount: u64,
    pub is_spl: bool,
    pub status: EscrowStatus,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum EscrowStatus {
    Draft,
    Funded,
    Released,
    Refunded,
}

#[error_code]
pub enum HaleError {
    #[msg("Asset type (SOL/SPL) mismatch")]
    AssetMismatch,
    #[msg("Invalid escrow status")]
    InvalidStatus,
    #[msg("Unauthorized access")]
    Unauthorized,
}
