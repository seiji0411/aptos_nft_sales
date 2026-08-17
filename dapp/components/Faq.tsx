import React, {useState} from "react";
import {FAQ} from "@/lib/types";

interface Props {
    faq: FAQ
}

export default function Faq({faq}: Props) {
    const [open, setOpen] = useState(false);
    return (
        <div className="pt-6" data-headlessui-state="">
            <dt>
                <button className="flex w-full items-start justify-between text-left text-white faq-btn group"
                        type="button"
                        aria-expanded="false" data-headlessui-state="" onClick={() => setOpen(!open)}>
                    <span className="text-2xl font-semibold faq-text">
                        {faq.title}
                        <span className="block max-w-0 group-hover:max-w-full transition-all duration-500 h-0.5 bg-aptosgreen"></span>
                    </span>
                    {
                        open ?
                            <span className="ml-6 flex h-7 items-center cursor-pointer">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none"
                             viewBox="0 0 24 24" strokeWidth="1.5"
                             stroke="currentColor" aria-hidden="true"
                             data-slot="icon" className="h-6 w-6"><path
                            strokeLinecap="round" strokeLinejoin="round" d="M5 12h14"></path></svg>
                    </span> :
                            <span
                                className="ml-6 flex h-7 items-center cursor-pointer">
                        <svg xmlns="http://www.w3.org/2000/svg"
                             fill="none" viewBox="0 0 24 24"
                             strokeWidth="1.5"
                             stroke="currentColor"
                             aria-hidden="true" data-slot="icon"
                             className="h-6 w-6">
                            <path
                                strokeLinecap="round" strokeLinejoin="round"
                                d="M12 4.5v15m7.5-7.5h-15"></path></svg></span>
                    }
                </button>
            </dt>
            {open && <dd className="mt-2 pr-12"><p
                className="text-gray-300" dangerouslySetInnerHTML={{ __html: faq.content }}></p></dd>}
        </div>
    );
}