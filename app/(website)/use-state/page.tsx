"use client";
import { useState } from "react";

const UseState = () => {
  const [count, setCount] = useState(0);

  return (
    <div className="w-100 flex gap-0.5" >
        Current value: {count} <br />
        <button className="p-5 bg-amber-700 rounded" onClick={()=> setCount(count + 1)}> increment</button> <br />
        <button className="p-5 bg-amber-200 rounded" onClick={()=> setCount(count - 1)}> decrement</button>
    </div>

  );

};

export default UseState;
