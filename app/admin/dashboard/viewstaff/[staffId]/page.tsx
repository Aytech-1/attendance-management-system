import { redirect } from "next/navigation";

export default function ViewProfile() {
    redirect("/admin/dashboard/staff");
}