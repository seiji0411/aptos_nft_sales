export function mintNFTPayload(
    collection_address: string,
    referrer: string,
) {
    return {
        type: "entry_function_payload",
        function:
            collection_address +
            "::candymachine_core::create_alien_nft",
        type_arguments: [],
        arguments: [
            referrer,
        ],
    };
}

export function getCollectionPayload(collection_name: string) {
    return {
        function:
            process.env.NEXT_PUBLIC_CANDY_MACHINE_ID +
            "::candymachine_core::get_collection",
        type_arguments: [],
        arguments: [
            collection_name
        ],
    };
}

export function getReferralPayload(account_address: string) {
    return {
        function:
            process.env.NEXT_PUBLIC_CANDY_MACHINE_ID +
            "::aliens_core::get_referral",
        type_arguments: [],
        arguments: [
            account_address
        ],
    };
}

export function getMintPricePayload() {
    return {
        function:
            process.env.NEXT_PUBLIC_CANDY_MACHINE_ID +
            "::aliens_core::get_mint_price",
        type_arguments: [],
        arguments: [],
    };
}

export function createReferralPayload(referral: string) {
    return {
        type: "entry_function_payload",
        function:
            process.env.NEXT_PUBLIC_CANDY_MACHINE_ID +
            "::aliens_core::set_referrer",
        type_arguments: [],
        arguments: [
            referral,
        ],
    };
}