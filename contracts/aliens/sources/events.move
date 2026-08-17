module aliens::aliens_events {
    use std::string::String;

    struct WithdrawEvent has store, drop {
        to: address,
        amount: u64,
        timestamp: u64,
    }

    struct SetReferrerEvent has store, drop {
        referrer: String,
        account: address,
        timestamp: u64,
    }

    struct SetMintPriceEvent has store, drop {
        mint_price: u64,
        timestamp: u64,
    }

    public fun new_withdraw_event(
        to: address,
        amount: u64,
        timestamp: u64
    ): WithdrawEvent {
        WithdrawEvent {
            to,
            amount,
            timestamp,
        }
    }

    public fun new_set_referrer_event(
        referrer: String,
        account: address,
        timestamp: u64
    ): SetReferrerEvent {
        SetReferrerEvent {
            referrer,
            account,
            timestamp,
        }
    }

    public fun new_set_mint_price_event(
        mint_price: u64,
        timestamp: u64
    ): SetMintPriceEvent {
        SetMintPriceEvent {
            mint_price,
            timestamp,
        }
    }
}