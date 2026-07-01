import {
  createUseReadContract,
  createUseWriteContract,
  createUseSimulateContract,
  createUseWatchContractEvent,
} from 'wagmi/codegen'

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ManualNFT
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const manualNftAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: 'name_', internalType: 'string', type: 'string' },
      { name: 'symbol_', internalType: 'string', type: 'string' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'tokenId', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'owner', internalType: 'address', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'getApproved',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'owner', internalType: 'address', type: 'address' },
      { name: 'operator', internalType: 'address', type: 'address' },
    ],
    name: 'isApprovedForAll',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'uri_', internalType: 'string', type: 'string' },
    ],
    name: 'mint',
    outputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'name',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'ownerOf',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'tokenId', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'safeTransferFrom',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'tokenId', internalType: 'uint256', type: 'uint256' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'safeTransferFrom',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'operator', internalType: 'address', type: 'address' },
      { name: 'approved', internalType: 'bool', type: 'bool' },
    ],
    name: 'setApprovalForAll',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'interfaceId', internalType: 'bytes4', type: 'bytes4' }],
    name: 'supportsInterface',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'index', internalType: 'uint256', type: 'uint256' }],
    name: 'tokenByIndex',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'owner', internalType: 'address', type: 'address' },
      { name: 'index', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'tokenOfOwnerByIndex',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'tokenURI',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'tokenId', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transferFrom',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'owner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'approved',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'tokenId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
    ],
    name: 'Approval',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'owner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'operator',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      { name: 'approved', internalType: 'bool', type: 'bool', indexed: false },
    ],
    name: 'ApprovalForAll',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'to', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'tokenId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      { name: 'uri', internalType: 'string', type: 'string', indexed: false },
    ],
    name: 'Minted',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'from', internalType: 'address', type: 'address', indexed: true },
      { name: 'to', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'tokenId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
    ],
    name: 'Transfer',
  },
  { type: 'error', inputs: [], name: 'NFT__InvalidOwner' },
  { type: 'error', inputs: [], name: 'NFT__InvalidRecipient' },
  { type: 'error', inputs: [], name: 'NFT__NonERC721Receiver' },
  { type: 'error', inputs: [], name: 'NFT__NonexistentToken' },
  { type: 'error', inputs: [], name: 'NFT__NotAuthorized' },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// React
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link manualNftAbi}__
 */
export const useReadManualNft = /*#__PURE__*/ createUseReadContract({
  abi: manualNftAbi,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link manualNftAbi}__ and `functionName` set to `"balanceOf"`
 */
export const useReadManualNftBalanceOf = /*#__PURE__*/ createUseReadContract({
  abi: manualNftAbi,
  functionName: 'balanceOf',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link manualNftAbi}__ and `functionName` set to `"getApproved"`
 */
export const useReadManualNftGetApproved = /*#__PURE__*/ createUseReadContract({
  abi: manualNftAbi,
  functionName: 'getApproved',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link manualNftAbi}__ and `functionName` set to `"isApprovedForAll"`
 */
export const useReadManualNftIsApprovedForAll =
  /*#__PURE__*/ createUseReadContract({
    abi: manualNftAbi,
    functionName: 'isApprovedForAll',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link manualNftAbi}__ and `functionName` set to `"name"`
 */
export const useReadManualNftName = /*#__PURE__*/ createUseReadContract({
  abi: manualNftAbi,
  functionName: 'name',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link manualNftAbi}__ and `functionName` set to `"ownerOf"`
 */
export const useReadManualNftOwnerOf = /*#__PURE__*/ createUseReadContract({
  abi: manualNftAbi,
  functionName: 'ownerOf',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link manualNftAbi}__ and `functionName` set to `"supportsInterface"`
 */
export const useReadManualNftSupportsInterface =
  /*#__PURE__*/ createUseReadContract({
    abi: manualNftAbi,
    functionName: 'supportsInterface',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link manualNftAbi}__ and `functionName` set to `"symbol"`
 */
export const useReadManualNftSymbol = /*#__PURE__*/ createUseReadContract({
  abi: manualNftAbi,
  functionName: 'symbol',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link manualNftAbi}__ and `functionName` set to `"tokenByIndex"`
 */
export const useReadManualNftTokenByIndex = /*#__PURE__*/ createUseReadContract(
  { abi: manualNftAbi, functionName: 'tokenByIndex' },
)

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link manualNftAbi}__ and `functionName` set to `"tokenOfOwnerByIndex"`
 */
export const useReadManualNftTokenOfOwnerByIndex =
  /*#__PURE__*/ createUseReadContract({
    abi: manualNftAbi,
    functionName: 'tokenOfOwnerByIndex',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link manualNftAbi}__ and `functionName` set to `"tokenURI"`
 */
export const useReadManualNftTokenUri = /*#__PURE__*/ createUseReadContract({
  abi: manualNftAbi,
  functionName: 'tokenURI',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link manualNftAbi}__ and `functionName` set to `"totalSupply"`
 */
export const useReadManualNftTotalSupply = /*#__PURE__*/ createUseReadContract({
  abi: manualNftAbi,
  functionName: 'totalSupply',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link manualNftAbi}__
 */
export const useWriteManualNft = /*#__PURE__*/ createUseWriteContract({
  abi: manualNftAbi,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link manualNftAbi}__ and `functionName` set to `"approve"`
 */
export const useWriteManualNftApprove = /*#__PURE__*/ createUseWriteContract({
  abi: manualNftAbi,
  functionName: 'approve',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link manualNftAbi}__ and `functionName` set to `"mint"`
 */
export const useWriteManualNftMint = /*#__PURE__*/ createUseWriteContract({
  abi: manualNftAbi,
  functionName: 'mint',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link manualNftAbi}__ and `functionName` set to `"safeTransferFrom"`
 */
export const useWriteManualNftSafeTransferFrom =
  /*#__PURE__*/ createUseWriteContract({
    abi: manualNftAbi,
    functionName: 'safeTransferFrom',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link manualNftAbi}__ and `functionName` set to `"setApprovalForAll"`
 */
export const useWriteManualNftSetApprovalForAll =
  /*#__PURE__*/ createUseWriteContract({
    abi: manualNftAbi,
    functionName: 'setApprovalForAll',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link manualNftAbi}__ and `functionName` set to `"transferFrom"`
 */
export const useWriteManualNftTransferFrom =
  /*#__PURE__*/ createUseWriteContract({
    abi: manualNftAbi,
    functionName: 'transferFrom',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link manualNftAbi}__
 */
export const useSimulateManualNft = /*#__PURE__*/ createUseSimulateContract({
  abi: manualNftAbi,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link manualNftAbi}__ and `functionName` set to `"approve"`
 */
export const useSimulateManualNftApprove =
  /*#__PURE__*/ createUseSimulateContract({
    abi: manualNftAbi,
    functionName: 'approve',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link manualNftAbi}__ and `functionName` set to `"mint"`
 */
export const useSimulateManualNftMint = /*#__PURE__*/ createUseSimulateContract(
  { abi: manualNftAbi, functionName: 'mint' },
)

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link manualNftAbi}__ and `functionName` set to `"safeTransferFrom"`
 */
export const useSimulateManualNftSafeTransferFrom =
  /*#__PURE__*/ createUseSimulateContract({
    abi: manualNftAbi,
    functionName: 'safeTransferFrom',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link manualNftAbi}__ and `functionName` set to `"setApprovalForAll"`
 */
export const useSimulateManualNftSetApprovalForAll =
  /*#__PURE__*/ createUseSimulateContract({
    abi: manualNftAbi,
    functionName: 'setApprovalForAll',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link manualNftAbi}__ and `functionName` set to `"transferFrom"`
 */
export const useSimulateManualNftTransferFrom =
  /*#__PURE__*/ createUseSimulateContract({
    abi: manualNftAbi,
    functionName: 'transferFrom',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link manualNftAbi}__
 */
export const useWatchManualNftEvent = /*#__PURE__*/ createUseWatchContractEvent(
  { abi: manualNftAbi },
)

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link manualNftAbi}__ and `eventName` set to `"Approval"`
 */
export const useWatchManualNftApprovalEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: manualNftAbi,
    eventName: 'Approval',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link manualNftAbi}__ and `eventName` set to `"ApprovalForAll"`
 */
export const useWatchManualNftApprovalForAllEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: manualNftAbi,
    eventName: 'ApprovalForAll',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link manualNftAbi}__ and `eventName` set to `"Minted"`
 */
export const useWatchManualNftMintedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: manualNftAbi,
    eventName: 'Minted',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link manualNftAbi}__ and `eventName` set to `"Transfer"`
 */
export const useWatchManualNftTransferEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: manualNftAbi,
    eventName: 'Transfer',
  })
