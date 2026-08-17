module collection::candymachine_core {
    use std::bcs;
    use std::option::{is_some, borrow};
    use std::signer;
    use std::signer::address_of;
    use std::string::{Self, String, utf8};
    use std::vector;
    use aptos_framework::account::{Self, SignerCapability};
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::coin;
    use aptos_framework::event::{Self, EventHandle};
    use aptos_framework::timestamp;
    use aptos_token::token;
    use aptos_token::token::TokenId;
    use aliens::aliens_core::{get_referral_fee, get_royalty_payer, get_referral_account, get_resource_address, get_mint_price};

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
    const ERROR_INVALID_REFERRER: u64 = 8;
    const ERROR_REFERRER_KEY_ALREADY_EXISTS: u64 = 9;

    //////////////
    // PDA Seed //
    //////////////

    const CANDYMACHINE_SEED: vector<u8> = b"ALIENS_COLLECTION";

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
        // Collection info
        collection: CollectionInfo,
        // State signer
        cap: SignerCapability,
        // Events
        create_alien_collection_events: EventHandle<CreateAlienCollectionEvent>,
        create_alien_nft_events: EventHandle<CreateAlienNFTEvent>,
    }

    struct CollectionInfo has store, copy, drop {
        base_uri:String,
        current_token: u64,

        collection_name:String,
        base_token_name:String,
        token_description:String,
        // Property keys
        property_keys: vector<String>,
        // Property types
        property_types: vector<String>,
        // Property types
        property_values: vector<vector<u8>>,
    }

    /*
        Creates a PDA and initializes State resource
        @param admin - signer of the admin account
    */
    public entry fun init(
        admin: &signer,
        name: String,
        description: String,
        uri: String,
        max_supply: u64,
        base_uri: String,
        base_token_name: String,
        token_description: String,
    ) {
        assert_signer_is_admin(admin);

        let seed = CANDYMACHINE_SEED;
        vector::append(&mut seed, bcs::to_bytes<address>(&@collection));

        let (_, resource_cap) = account::create_resource_account(admin, seed);

        let creator = account::create_signer_with_capability(&resource_cap);
        create_collection_internal(&creator, name, description, uri, max_supply);

        let property_keys = vector::map(COLLECTION_PROPERTY_KEYS, |key|{ string::utf8(key)});
        let property_types = vector::map(COLLECTION_PROPERTY_TYPES, |key|{ string::utf8(key)});
        let property_values = vector::map(COLLECTION_PROPERTY_VALUES, |v|{ bcs::to_bytes<u64>(&v)});
        let collectionInfo = CollectionInfo {
            current_token: 0,
            collection_name: name,
            base_token_name,
            token_description,
            base_uri,
            property_keys,
            property_types,
            property_values,
        };

        // Create State instance and move it to the admin
        let create_collection_event_handler = account::new_event_handle<CreateAlienCollectionEvent>(admin);

        // Emit CreateAlienCollectionEvent event
        event::emit_event(&mut create_collection_event_handler ,
            new_create_alien_collection_event(name, description, uri, max_supply, timestamp::now_seconds()));

        move_to(admin, State {
            collection: collectionInfo,
            cap: resource_cap,
            create_alien_collection_events: create_collection_event_handler,
            create_alien_nft_events: account::new_event_handle<CreateAlienNFTEvent>(admin),
        });
    }

    fun num_str(num: u64): String{

        let v1 = vector::empty();

        while (num/10 > 0){
            let rem = num%10;
            vector::push_back(&mut v1, (rem+48 as u8));
            num = num/10;
        };

        vector::push_back(&mut v1, (num+48 as u8));

        vector::reverse(&mut v1);

        utf8(v1)
    }

    public entry fun create_alien_nft(
        account: &signer,
        referrer: String,
    ) acquires State {
        assert_state_initialized();

        create_alien_nft_internal(account, referrer);
    }


    inline fun create_collection_internal(
        creator: &signer,
        name: String,
        description: String,
        uri: String,
        supply: u64,
    ) {
        let mutate_setting = vector<bool>[false, false, false];

        // Call token::create_collection_script function with appropriate parameters
        token::create_collection_script(
            creator,
            name,
            description,
            uri,
            supply,
            mutate_setting,
        )
    }

    inline fun create_alien_nft_internal(
        account: &signer,
        referrer: String,
    ) acquires State {
        let state = borrow_global_mut<State>(@aliens);

        let resource_account_address = account::get_signer_capability_address(&state.cap);
        let resource_signer = account::create_signer_with_capability(&state.cap);

        let collection_info = &mut state.collection;
        let property_keys = collection_info.property_keys;
        let property_types = collection_info.property_types;
        let property_values = collection_info.property_values;

        let collection_name = collection_info.collection_name;
        let token_name = collection_info.base_token_name;
        string::append(&mut token_name,num_str(collection_info.current_token));
        let token_description = collection_info.token_description;
        let mutate_setting = vector<bool>[ false, false, false, false, false, false ];

        let uri:String = collection_info.base_uri;

        token::create_token_script(
            &resource_signer,
            collection_name,
            token_name,
            token_description,
            1,
            1,
            uri,
            get_royalty_payer(),
            ROYALTY_DENOMINATOR,
            ROYALTY_NUMERATOR,
            mutate_setting,
            property_keys,
            property_values,
            property_types,
        );

        let token_id = token::create_token_id_raw(resource_account_address,collection_name,token_name,0 );
        token::direct_transfer(&resource_signer, account, token_id, 1);

        // crease current_token
        collection_info.current_token = collection_info.current_token + 1;

        // Transfer Aptos
        let transfer_amount = get_mint_price();
        let referral_account = get_referral_account(referrer);
        if (is_some(&referral_account) && *borrow(&referral_account) != address_of(account)) {
            let referral_address = borrow(&referral_account);

            let referrer_fee_amount = transfer_amount * (get_referral_fee() as u64) / FEE_DECISION;
            transfer_amount = transfer_amount - referrer_fee_amount;

            // transfer referral fee
            coin::transfer<AptosCoin>(account, *referral_address, referrer_fee_amount);
        };

        coin::transfer<AptosCoin>(account, get_resource_address(), transfer_amount);

        event::emit_event(&mut state.create_alien_nft_events ,
            new_create_alien_nft_event(
                token_id,
                signer::address_of(account),
                token_description,
                uri,
                timestamp::now_seconds()
            )
        );
    }

    #[view]
    public fun get_collection():CollectionInfo acquires State {
        assert_state_initialized();

        borrow_global<State>(@aliens).collection
    }

    /////////////
    // ASSERTS //
    /////////////

    inline fun assert_signer_is_admin(admin: &signer) {
        assert!(signer::address_of(admin) == @aliens, ERROR_SIGNER_NOT_ADMIN);
    }

    inline fun assert_state_initialized() {
        assert!(exists<State>(@aliens), ERROR_STATE_NOT_INITIALIZED);
    }

    inline fun assert_collection_does_not_exist(collections: &vector<String>, collection_name: &String) {
        assert!(!vector::contains(collections, collection_name), ERROR_COLLECTION_ALREADY_EXISTS);
    }

    struct CreateAlienCollectionEvent has store, drop {
        name: String,
        description: String,
        uri: String,
        max_supply: u64,
        timestamp: u64
    }

    struct CreateAlienNFTEvent has store, drop {
        id: TokenId,
        receiver: address,
        description: String,
        uri: String,
        timestamp: u64
    }

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

    public fun new_create_alien_collection_event(
        name: String,
        description: String,
        uri: String,
        max_supply: u64,
        timestamp: u64
    ): CreateAlienCollectionEvent {
        CreateAlienCollectionEvent { name, description, uri, max_supply, timestamp}
    }

    public fun new_create_alien_nft_event(
        id: TokenId,
        receiver: address,
        description: String,
        uri: String,
        timestamp: u64
    ): CreateAlienNFTEvent {
        CreateAlienNFTEvent {
            id,
            receiver,
            uri,
            description,
            timestamp
        }
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
}