import { useAuth } from "@/contexts/AuthContext";
import MobileBottomNavAdmin from "./MobileBottomNavAdmin";
import MobileBottomNavUser from "./MobileBottomNavUser";

export default function MobileBottomNav() {
  const { isAdmin } = useAuth();
  return isAdmin ? <MobileBottomNavAdmin /> : <MobileBottomNavUser />;
}

