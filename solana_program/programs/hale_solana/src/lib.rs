use anchor_lang::prelude::*;

declare_id!("CnwQj2kPHpTbAvJT3ytzekrp7xd4HEtZJuEua9yn9MMe");

#[program]
pub mod hale_solana {
    use super::*;

    pub fn initialize_attestation(
        ctx: Context<InitializeAttestation>,
        intent_hash: [u8; 32],
        metadata_uri: String,
    ) -> Result<()> {
        let attestation = &mut ctx.accounts.attestation;
        attestation.authority = ctx.accounts.authority.key();
        attestation.intent_hash = intent_hash;
        attestation.metadata_uri = metadata_uri;
        attestation.status = AttestationStatus::Draft;
        attestation.bump = ctx.bumps.attestation;
        
        msg!("Attestation initialized for intent: {:?}", intent_hash);
        Ok(())
    }

    pub fn seal_attestation(
        ctx: Context<SealAttestation>,
        outcome_hash: [u8; 32],
    ) -> Result<()> {
        let attestation = &mut ctx.accounts.attestation;
        attestation.outcome_hash = Some(outcome_hash);
        attestation.status = AttestationStatus::Sealed;
        
        emit!(AttestationSealed {
            authority: attestation.authority,
            intent_hash: attestation.intent_hash,
            outcome_hash,
        });

        msg!("Attestation sealed with outcome: {:?}", outcome_hash);
        Ok(())
    }

    pub fn audit_attestation(
        ctx: Context<AuditAttestation>,
        report_hash: [u8; 32],
        is_valid: bool,
    ) -> Result<()> {
        let attestation = &mut ctx.accounts.attestation;
        attestation.status = if is_valid {
            AttestationStatus::Audited
        } else {
            AttestationStatus::Disputed
        };
        attestation.report_hash = Some(report_hash);

        emit!(AttestationAudited {
            authority: attestation.authority,
            auditor: ctx.accounts.auditor.key(),
            intent_hash: attestation.intent_hash,
            report_hash,
            is_valid,
        });

        msg!("Attestation audited. Valid: {}", is_valid);
        Ok(())
    }

    pub fn challenge_attestation(
        ctx: Context<ChallengeAttestation>,
        evidence_uri: String,
    ) -> Result<()> {
        let attestation = &mut ctx.accounts.attestation;
        
        // Only allow challenging Sealed or Audited attestations
        require!(
            attestation.status == AttestationStatus::Sealed || attestation.status == AttestationStatus::Audited,
            HaleError::InvalidStatusForChallenge
        );

        attestation.status = AttestationStatus::Disputed;
        attestation.evidence_uri = Some(evidence_uri.clone());
        
        emit!(AttestationChallenged {
            authority: attestation.authority,
            challenger: ctx.accounts.challenger.key(),
            intent_hash: attestation.intent_hash,
            evidence_uri,
        });

        msg!("Attestation challenged by: {:?}", ctx.accounts.challenger.key());
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(intent_hash: [u8; 32], metadata_uri: String)]
pub struct InitializeAttestation<'info> {
    #[account(
        init,
        payer = authority,
        space = 600, // Fixed size allocation to avoid calculation issues
        seeds = [b"attestation", authority.key().as_ref(), intent_hash.as_ref()],
        bump
    )]
    pub attestation: Account<'info, Attestation>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SealAttestation<'info> {
    #[account(
        mut,
        has_one = authority,
        seeds = [b"attestation", authority.key().as_ref(), attestation.intent_hash.as_ref()],
        bump = attestation.bump,
    )]
    pub attestation: Account<'info, Attestation>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct AuditAttestation<'info> {
    #[account(
        mut,
        seeds = [b"attestation", attestation.authority.as_ref(), attestation.intent_hash.as_ref()],
        bump = attestation.bump,
    )]
    pub attestation: Account<'info, Attestation>,
    pub auditor: Signer<'info>,
}

#[derive(Accounts)]
pub struct ChallengeAttestation<'info> {
    #[account(
        mut,
        seeds = [b"attestation", attestation.authority.as_ref(), attestation.intent_hash.as_ref()],
        bump = attestation.bump,
    )]
    pub attestation: Account<'info, Attestation>,
    #[account(mut)]
    pub challenger: Signer<'info>,
}

#[account]
pub struct Attestation {
    pub authority: Pubkey,
    pub intent_hash: [u8; 32],
    pub metadata_uri: String,
    pub status: AttestationStatus,
    pub outcome_hash: Option<[u8; 32]>,
    pub report_hash: Option<[u8; 32]>,
    pub evidence_uri: Option<String>,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum AttestationStatus {
    Draft,
    Sealed,
    Audited,
    Disputed,
}

#[event]
pub struct AttestationSealed {
    pub authority: Pubkey,
    pub intent_hash: [u8; 32],
    pub outcome_hash: [u8; 32],
}

#[event]
pub struct AttestationAudited {
    pub authority: Pubkey,
    pub auditor: Pubkey,
    pub intent_hash: [u8; 32],
    pub report_hash: [u8; 32],
    pub is_valid: bool,
}

#[event]
pub struct AttestationChallenged {
    pub authority: Pubkey,
    pub challenger: Pubkey,
    pub intent_hash: [u8; 32],
    pub evidence_uri: String,
}

#[error_code]
pub enum HaleError {
    #[msg("Attestation is not in a sealable state.")]
    InvalidStatusForSeal,
    #[msg("Attestation is not in a state that can be challenged.")]
    InvalidStatusForChallenge,
}
