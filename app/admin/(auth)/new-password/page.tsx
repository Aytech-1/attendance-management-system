'use client';
import { useRouter } from "next/navigation";
import InputField from "@/components/ui/text-field";
import Button from "@/components/ui/button";
const NewPassword = () => {
    const router = useRouter()
    return (
        <>
            <div className="w-[80%] flex flex-col gap-5 justify-center items-center mx-auto">
                <h1 className='text-2xl! text-center'>Complete Reset Password</h1>
                <InputField
                    id="password"
                    label="New password"
                    type="password"
                    value=""
                    onChange={() => { }}
                />
                <InputField
                    id="confirmPassword"
                    label="Confirm password"
                    type="password"
                    value=""
                    onChange={() => { }}
                />

                <p className='w-full text-[12px] text-gray-500 bg-amber-100 p-4 rounded border border-amber-300 italic'>At least 8 characters is required.</p>

                <Button
                    id="reset-btn"
                    text="RESET PASSWORD"
                    type="submit"
                    onClick={() => router.push("/admin/login")}
                />
            </div>
        </>
    )
}

export default NewPassword