import erc20 from "@/utils/abis/ERC20.json";
import ico from "@/utils/abis/ICO.json";
import { icoContract, lprContract, usdcContract } from "@/utils/constants";
import { ethers, type providers } from "ethers";

export function getABI(contract: string) {
  switch (contract.toLowerCase()) {
    case "erc20":
    case "usdc":
    case "usdt":
    case "lpr":
      return erc20;
    case "ico":
      return ico;
    default:
      return [];
  }
}

export function getContractAddress(contractName: string): string {
  switch (contractName.toLowerCase()) {
    case "usdc":
      return usdcContract;
    case "lpr":
      return lprContract;
    case "ico":
      return icoContract;
    default:
      return "";
  }
}

export async function callGetter(
  contractName: string,
  getterName: string,
  // eslint-disable-next-line
  params: any[] = [],
  _provider: null,
  // eslint-disable-next-line
): Promise<any | null> {
  try {
    const provider =
      _provider !== null
        ? _provider
        : // TODO: @diegoxter check this later, I had to downgrade ethers to 5.7.0 and it broke this line
          // eslint-disable-next-line
          // @ts-ignore
          // eslint-disable-next-line
          new ethers.BrowserProvider((window as any).ethereum);
    const contract = new ethers.Contract(
      getContractAddress(contractName),
      getABI(contractName),
      provider,
    );

    const result = await contract[getterName](...params);

    return result;
  } catch (error) {
    console.error("Error calling contract function:", getterName, error);
    return null;
  }
}

export async function bulkCallGetters(
  contractName: string,
  getterNames: string[],
  params?: string[][],
  provider: providers.JsonRpcProvider | null = null,
): Promise<bigint[]> {
  // eslint-disable-next-line
  const results: any[] = [];
  const parsedParams: string[][] = params
    ? params
    : Array(getterNames.length).fill([]);

  for (const [index, getterName] of getterNames.entries()) {
    const res = await callGetter(
      contractName,
      getterName,
      parsedParams[index],
      // TODO: @diegoxter check this later, I had to downgrade ethers to 5.7.0 and it broke this line
      // eslint-disable-next-line
      // @ts-ignore
      // eslint-disable-next-line
      provider,
    );
    results.push(res !== null ? res : 0);
  }

  return results;
}
