module aliens::aliens_core {
    use std::option::{none, Option, some};
    use std::signer;
    use std::string::{String};
    use std::vector;
    use aptos_std::simple_map::{Self, SimpleMap};
    use aptos_framework::account::{Self, SignerCapability};
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::coin;
    use aptos_framework::event::{Self, EventHandle};
    use aptos_framework::timestamp;
    use aliens::aliens_events::{
        WithdrawEvent,
        new_withdraw_event, new_set_referrer_event, SetReferrerEvent, SetMintPriceEvent, new_set_mint_price_event};

    ////////////
    // ERRORS //
    ////////////

    const ERROR_SIGNER_NOT_ADMIN: u64 = 0;
    const ERROR_STATE_NOT_INITIALIZED: u64 = 1;
    const ERROR_COLLECTION_ALREADY_EXISTS: u64 = 2;
    const ERROR_COLLECTION_DOES_NOT_EXIST: u64 = 3;
    const ERROR_SIGNER_IS_NOT_THE_OWNER: u64 = 4;
    const ERROR_PROPERTY_LENGTH_MISMATCH: u64 = 5;
    const ERROR_TOKEN_FROM_WRONG_COLLECTION: u64 = 6;
    const ERROR_INVALID_AMOUNT: u64 = 7;
    const ERROR_REFERRER_ALREADY_EXISTS: u64 = 8;
    const ERROR_REFERRER_KEY_ALREADY_EXISTS: u64 = 9;

    //////////////
    // PDA Seed //
    //////////////

    const ALIENS_CORE_SEED: vector<u8> = b"ALIENS_CORE";

    //////////////////////////
    // COLLECTIONS SETTINGS //
    //////////////////////////

    const ROYALTY_NUMERATOR: u64 = 100;
    const ROYALTY_DENOMINATOR: u64 = 10000;
    const FEE_DECISION: u64 = 10000;

    const COLLECTION_PROPERTY_KEYS: vector<vector<u8>> = vector[];
    const COLLECTION_PROPERTY_TYPES: vector<vector<u8>> = vector[];
    const COLLECTION_PROPERTY_VALUES: vector<u64> = vector[];

    /*
        Resource kept under admin address. Stores data about available collections.
    */
    struct State has key {
        // Mint price
        mint_price: u64,
        // Referrer map
        referrer_map: SimpleMap<String, address>,
        // Referral fee
        referral_fee: u16,
        // Royalty fee payer
        royalty_payer: address,
        // State signer
        cap: SignerCapability,
        // events
        withdraw_events: EventHandle<WithdrawEvent>,
        set_referrer_events: EventHandle<SetReferrerEvent>,
        set_mint_price_events: EventHandle<SetMintPriceEvent>,
    }
    /*
        Creates a PDA and initializes State resource
        @param admin - signer of the admin account
    */
    public entry fun init(admin: &signer, mint_price: u64, referral_fee: u16, royalty_payer: address) {
        // Assert the signer is the admin
        assert_signer_is_admin(admin);

        // Create resource account
        let (resource_signer, resource_cap) = account::create_resource_account(admin, ALIENS_CORE_SEED);

        // Register the resource account with AptosCoin
        coin::register<AptosCoin>(&resource_signer);

        // Create State instance and move it to the admin
        move_to(
            admin,
            State {
                referrer_map: simple_map::create<String, address>(),
                mint_price,
                referral_fee,
                royalty_payer,
                cap: resource_cap,
                withdraw_events: account::new_event_handle<WithdrawEvent>(admin),
                set_referrer_events: account::new_event_handle<SetReferrerEvent>(admin),
                set_mint_price_events: account::new_event_handle<SetMintPriceEvent>(admin),
            });
    }

    public entry fun set_mint_price(
        account: &signer,
        new_mint_price: u64,
    ) acquires State {
        // Assert that state is initialized
        assert_state_initialized();

        // Assert the signer is the admin
        assert_signer_is_admin(account);

        let state = borrow_global_mut<State>(@aliens);
        state.mint_price = new_mint_price;

        // Emit Withdraw event
        event::emit_event(&mut state.set_mint_price_events , new_set_mint_price_event(new_mint_price, timestamp::now_seconds()));
    }

    public entry fun set_referrer(
        account: &signer,
        referrer: String,
    ) acquires State {
        // Assert that state is initialized
        assert_state_initialized();

        // Assert that a collection with provided name does not exist
        let state = borrow_global_mut<State>(@aliens);
        let (referral_keys, referral_values) = simple_map::to_vec_pair(state.referrer_map);
        assert_referrer_does_not_exist(&referral_keys, &referrer);
        assert_referrer_not_set(&referral_values, signer::address_of(account));

        let account_address = signer::address_of(account);
        simple_map::add(&mut state.referrer_map, referrer, account_address);

        event::emit_event(&mut state.set_referrer_events ,
            new_set_referrer_event(referrer, account_address, timestamp::now_seconds()));
    }

    public entry fun withdraw(
        admin: &signer,
        to: address,
        amount: u64,
    ) acquires State {
        // Assert that the state is initialized
        assert_state_initialized();

        // Assert the signer is the admin
        assert_signer_is_admin(admin);

        let state = borrow_global_mut<State>(@aliens);
        let resource_account_address = account::create_resource_address(&@aliens, ALIENS_CORE_SEED);
        let resource_signer = account::create_signer_with_capability(&state.cap);

        assert!(coin::balance<AptosCoin>(resource_account_address) >= amount, ERROR_INVALID_AMOUNT);
        coin::transfer<AptosCoin>(&resource_signer, to, amount);

        // Emit Withdraw event
        event::emit_event(&mut state.withdraw_events , new_withdraw_event(to, amount, timestamp::now_seconds()));
    }

    #[view]
    public fun get_referral(account: address): Option<String> acquires State {
        // Call assert_state_initialized function
        assert_state_initialized();

        let (referral_keys, referral_values) = simple_map::to_vec_pair(borrow_global<State>(@aliens).referrer_map);
        let (exits, index) = vector::find(&referral_values, |rv|{ *rv == account });
        if (!exits) {
            none<String>()
        } else {
            some(*vector::borrow(&referral_keys, index))
        }
    }

    #[view]
    public fun get_referral_account(referral: String): Option<address> acquires State {
        // Call assert_state_initialized function
        assert_state_initialized();

        let (referral_keys, referral_values) = simple_map::to_vec_pair(borrow_global<State>(@aliens).referrer_map);
        let (exits, index) = vector::find(&referral_keys, |rv|{ *rv == referral });
        if (!exits) {
            none<address>()
        } else {
            some(*vector::borrow(&referral_values, index))
        }
    }

    #[view]
    public fun get_referrals(): SimpleMap<String, address> acquires State {
        // Call assert_state_initialized function
        assert_state_initialized();

        borrow_global<State>(@aliens).referrer_map
    }

    #[view]
    public fun get_referral_fee(): u16 acquires State {
        // Call assert_state_initialized function
        assert_state_initialized();

        borrow_global<State>(@aliens).referral_fee
    }

    #[view]
    public fun get_royalty_payer(): address acquires State {
        // Call assert_state_initialized function
        assert_state_initialized();

        borrow_global<State>(@aliens).royalty_payer
    }

    #[view]
    public fun get_resource_address(): address acquires State {
        // Call assert_state_initialized function
        assert_state_initialized();

        account::get_signer_capability_address(&borrow_global<State>(@aliens).cap)
    }

    #[view]
    public fun get_mint_price(): u64 acquires State {
        // Call assert_state_initialized function
        assert_state_initialized();

        borrow_global<State>(@aliens).mint_price
    }

    /////////////
    // ASSERTS //
    /////////////

    inline fun assert_signer_is_admin(admin: &signer) {
        // Assert that address of the parameter is the same as admin in Move.toml
        assert!(signer::address_of(admin) == @aliens, ERROR_SIGNER_NOT_ADMIN);
    }

    inline fun assert_state_initialized() {
        // Assert that State resource exists at the admin address
        assert!(exists<State>(@aliens), ERROR_STATE_NOT_INITIALIZED);
    }

    inline fun assert_referrer_does_not_exist(referrers: &vector<String>, referrer: &String) {
        // Assert that the vector does not contain the referrer's name
        assert!(!vector::contains(referrers, referrer), ERROR_REFERRER_KEY_ALREADY_EXISTS);
    }

    inline fun assert_referrer_not_set(referrers: &vector<address>, referrer: address) {
        // Assert that the vector does not contain the referrer's name
        assert!(!vector::contains(referrers, &referrer), ERROR_REFERRER_ALREADY_EXISTS);
    }
}