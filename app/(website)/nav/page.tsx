'use client';
import { useState } from "react";

const NavBar = () => {
    const [open, setOpen] = useState(false);
    return (
    <div>
        <button onClick={() => setOpen(true) }>Open Nav</button>
        {open && (
        <h1>i am open</h1>
    )}
    
    </div>);
};

export default NavBar;
