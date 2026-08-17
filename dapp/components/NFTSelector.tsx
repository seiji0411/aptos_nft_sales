import React from "react";
import {Slider} from "@/components/ui/slider";

type Props = {
    selectedCollections: Array<string>,
    onChangeSelected: (slen: number) => void,
    onMintSelected: () => void,
    total: number,
    mintPrice: number
}

export default function NFTSelector({total, selectedCollections, onChangeSelected, onMintSelected, mintPrice}: Props) {
    const selectedLen = selectedCollections.length;
    const totalCost = Math.floor(selectedLen  * mintPrice * 10000) / 10000;

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-6">
                <div>Select quantity</div>
                <div>Total cost: {totalCost} APT</div>
            </div>
            <div className="flex items-center flex-wrap gap-6">
                <div className="rounded-lg bg-neutral-950 border border-gray-800 px-4 py-5 w-full sm:w-[160px]">
                    <Slider value={[selectedLen]} max={total} step={1} onValueChange={(v: Array<number>) => onChangeSelected(v[0])}/>
                </div>
                <div className="flex items-center gap-2 h-12">
                    <input
                        type="number"
                        className="text-white bg-neutral-950 border border-white rounded-md h-full w-16 text-center"
                        min="0"
                        max="50"
                        value={selectedLen}
                        onChange={(v) => onChangeSelected(Number(v.target.value))}
                    />
                    <button className="flex items-center h-full bg-neutral-950 border border-gray-800 gap-2 rounded-lg px-4" onClick={() => onChangeSelected(total)}>
                        Max
                    </button>
                </div>
                <button
                    type="button"
                    className="rounded-lg text-white px-4 py-3 bg-neutral-950 border border-aptosgreen"
                    onClick={onMintSelected}
                >
                    Mint Selected
                </button>
            </div>
        </div>
    );
}