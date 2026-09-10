import { redirect } from "next/navigation";

export default function ViewStudentRedirect() {
    redirect("/admin/dashboard/students");
}
