'use client';
import { useRouter } from 'next/navigation'
import InputField from "@/components/ui/text-field";
import Button from "@/components/ui/button";
const ResetPassword = () => {
    const router = useRouter()
    return (
        <>
            <div className="w-[80%] flex flex-col justify-start gap-5  mx-auto animate__animated animate__fadeIn">
                <h1 className='text-2xl! text-center'>Reset Your Password</h1>
                <InputField
                    id="email"
                    label="Email Address"
                    type="email"
                    value=""
                    onChange={() => { }}
                />

                <Button
                    id="proceed-btn"
                    text="PROCEED"
                    type="submit"
                    onClick={() => router.push("/admin/password-link")}
                />
                <p className='w-full text-[12px] text-gray-500 bg-(--bg-color) p-4 rounded border border-amber-300'>Already have an account? <span className="text-[12px] text-(--primary-color) cursor-pointer" onClick={() => router.push('/admin/login')}>SIGN-IN</span></p>
            </div>
        </>
    )
}

export default ResetPassword