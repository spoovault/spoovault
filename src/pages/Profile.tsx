import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader, Button, Input } from "@heroui/react";
import { FiUser, FiSliders, FiSave } from "react-icons/fi";
import { useWeb3 } from "../context/Web3Context";
import { shortenAddress } from "../utils/helpers";
import { toast } from "react-hot-toast";

const Profile = () => {
  const { account, isConnected } = useWeb3();
  const [nickname, setNickname] = useState("");
  const [theme, setTheme] = useState<"ember" | "midnight">("ember");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("spoovault-profile");
      if (stored) {
        const parsed = JSON.parse(stored) as { nickname?: string; theme?: "ember" | "midnight" };
        if (parsed.nickname) {
          setNickname(parsed.nickname);
        }
        if (parsed.theme) {
          setTheme(parsed.theme);
        }
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const handleSave = () => {
    const trimmedNickname = nickname.trim();
    try {
      localStorage.setItem(
        "spoovault-profile",
        JSON.stringify({ nickname: trimmedNickname, theme })
      );
      window.dispatchEvent(
        new CustomEvent("spoovault-profile-updated", {
          detail: { nickname: trimmedNickname, theme },
        })
      );
      toast.success("Profile updated");
    } catch {
      toast.error("Failed to save profile");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="text-gray-400">Manage your preferences</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border border-gray-800 bg-gray-900/40 backdrop-blur-sm">
          <CardHeader className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-700 to-brand-900 flex items-center justify-center">
              <FiUser className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Identity</h2>
              <p className="text-sm text-gray-400">Nickname and wallet info</p>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            <Input
              label="Nickname"
              placeholder="e.g. RedFox"
              value={nickname}
              onValueChange={setNickname}
              classNames={{
                input: "bg-gray-800/50 border-gray-700",
              }}
            />
            <div className="text-sm text-gray-400">
              Wallet: {isConnected ? shortenAddress(account || "", 6) : "Not connected"}
            </div>
          </CardBody>
        </Card>

        <Card className="border border-gray-800 bg-gray-900/40 backdrop-blur-sm">
          <CardHeader className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-700 to-brand-900 flex items-center justify-center">
              <FiSliders className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Theme</h2>
              <p className="text-sm text-gray-400">Choose your preferred look</p>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={theme === "ember" ? "solid" : "flat"}
                className={theme === "ember"
                  ? "bg-gradient-to-r from-brand-700 to-brand-900 text-white"
                  : "border border-gray-700 text-gray-300"}
                onPress={() => setTheme("ember")}
              >
                Ember
              </Button>
              <Button
                variant={theme === "midnight" ? "solid" : "flat"}
                className={theme === "midnight"
                  ? "bg-gradient-to-r from-brand-800 to-brand-900 text-white"
                  : "border border-gray-700 text-gray-300"}
                onPress={() => setTheme("midnight")}
              >
                Midnight
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Preferences are saved locally on this device.
            </p>
          </CardBody>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button
          className="bg-gradient-to-r from-brand-700 to-brand-900 font-semibold"
          startContent={<FiSave />}
          onPress={handleSave}
        >
          Save Changes
        </Button>
      </div>
    </div>
  );
};

export default Profile;
