import axios from "axios";

const PINATA_API_URL =
  import.meta.env.VITE_IPFS_API_URL || "https://api.pinata.cloud";
const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;
const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY;
const PINATA_API_SECRET = import.meta.env.VITE_PINATA_API_SECRET;
const IPFS_GATEWAY =
  import.meta.env.VITE_IPFS_GATEWAY || "https://gateway.pinata.cloud/ipfs/";

const isConfigured = (): boolean => {
  return !!PINATA_JWT || (!!PINATA_API_KEY && !!PINATA_API_SECRET);
};

const getURL = (hash: string): string => {
  return `${IPFS_GATEWAY}${hash}`;
};

const buildAuthHeaders = (): Record<string, string> => {
  if (PINATA_JWT) {
    return { Authorization: `Bearer ${PINATA_JWT}` };
  }
  if (PINATA_API_KEY && PINATA_API_SECRET) {
    return {
      pinata_api_key: PINATA_API_KEY,
      pinata_secret_api_key: PINATA_API_SECRET,
    };
  }
  return {};
};

const uploadFile = async (
  file: File,
  metadata: Record<string, any> = {}
): Promise<{ hash: string; size: number }> => {
  if (!isConfigured()) {
    throw new Error("IPFS is not configured");
  }

  const formData = new FormData();
  formData.append("file", file);

  if (metadata && Object.keys(metadata).length > 0) {
    const name = metadata.name || file.name;
    const keyvalues = metadata.keyvalues || metadata;
    formData.append("pinataMetadata", JSON.stringify({ name, keyvalues }));
  }

  try {
    const response = await axios.post(
      `${PINATA_API_URL}/pinning/pinFileToIPFS`,
      formData,
      {
        headers: buildAuthHeaders(),
        timeout: 90000,
        maxBodyLength: Infinity,
      }
    );

    return {
      hash: response.data.IpfsHash,
      size: response.data.PinSize,
    };
  } catch (error: any) {
    const isTimeout = error?.code === "ECONNABORTED";
    const message = isTimeout
      ? "IPFS upload timed out. Try again with a smaller file or better network."
      : error?.response?.data?.error?.reason ||
        error?.response?.data?.error ||
        error?.message ||
        "IPFS upload failed";
    throw new Error(message);
  }
};

export const ipfsService = {
  isConfigured,
  getURL,
  uploadFile,
};

