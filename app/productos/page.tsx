import ProductosContent from "./productContent";
import { getUserFromSession } from "@/app/Datalibs/auth";
import UserLayout from "@/app/user/layout";

export default async function ProductosPage() {
  const user = await getUserFromSession();

  if (user) {
    return (
      <UserLayout>
        <ProductosContent />
      </UserLayout>
    );
  }

  return <ProductosContent />;
}