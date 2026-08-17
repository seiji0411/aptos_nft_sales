import React from "react";
import Image from "next/image";
import {CollectionInfo} from "@/lib/types";

interface Props {
    selected: boolean;
    collection: CollectionInfo;
    onSelect: (collection: CollectionInfo, selected: boolean) => void;
    onMint: (collection: CollectionInfo) => void;
    mintPrice: number;
}


export default function NFTCard({ collection, selected, onSelect, onMint, mintPrice }: Props) {
    return (
        <div
            className="relative group bg-neutral-950 p-4 rounded-lg flex flex-col items-start gap-3 cursor-pointer ring-1 ring-aptosgreen hover:ring-2 hover:bg-neutral-900 hover:text-teal-400"
            onClick={() => onSelect(collection, !selected)}
        >
            { selected && <div className="absolute h-full w-full blur top-0 left-0 bg-gray-500 bg-opacity-30 z-10"></div>}
            <div className="relative flex items-center justify-center">
                <Image
                    alt={`${collection.collection_name}`}
                    width={200}
                    height={200}
                    className="border-gray-800 border"
                    style={{color:"transparent"}}
                    src={collection.collection_uri}
                />
                {
                    selected &&
                    <div
                        className="absolute px-3 py-2 border border-white bg-black rounded-lg flex items-center gap-1 z-20">
                        <span className="text-white">Selected</span>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#27e246" aria-hidden="true"
                             data-slot="icon" className="h-5 w-5 text-primary">
                            <path fillRule="evenodd"
                                  d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
                                  clipRule="evenodd"></path>
                        </svg>
                    </div>
                }
            </div>
            {/*<span className="text-white font-semibold">{collection.base_token_name}{(collection.current_token + 1)}</span>*/}
            <span className="text-white font-semibold">{collection.collection_name}</span>
            <div
                className="rounded-lg border border-gray-800 flex flex-col sm:flex-row sm:items-center w-full justify-between p-3 gap-2">
                <div className="flex flex-col items-start"><span className="text-xs text-gray-400">Price</span><span
                    className="text-sm text-white">{mintPrice} APT</span></div>
                <button
                    type="button"
                    className="rounded-lg text-white px-3 py-1 sm:px-4 sm:py-2 border border-gray-800 bg-white bg-opacity-5 hover:bg-opacity-100 hover:text-black"
                    onClick={(event) => {
                        event.stopPropagation();
                        onMint(collection)
                    }}
                >
                    Mint
                </button>
            </div>
        </div>
    );
}