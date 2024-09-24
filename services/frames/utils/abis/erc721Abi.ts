export const erc721Abi = [
  {
    inputs: [],
    name: 'ApprovalCallerNotOwnerNorApproved',
    type: 'error'
  },
  {
    inputs: [],
    name: 'ApprovalQueryForNonexistentToken',
    type: 'error'
  },
  {
    inputs: [],
    name: 'BalanceQueryForZeroAddress',
    type: 'error'
  },
  {
    inputs: [],
    name: 'EmptyString',
    type: 'error'
  },
  {
    inputs: [],
    name: 'InvalidManager',
    type: 'error'
  },
  {
    inputs: [],
    name: 'ManagerDoesNotExist',
    type: 'error'
  },
  {
    inputs: [],
    name: 'ManagerRemoveBlocked',
    type: 'error'
  },
  {
    inputs: [],
    name: 'ManagerSwapBlocked',
    type: 'error'
  },
  {
    inputs: [],
    name: 'MintERC2309QuantityExceedsLimit',
    type: 'error'
  },
  {
    inputs: [],
    name: 'MintFrozen',
    type: 'error'
  },
  {
    inputs: [],
    name: 'MintToZeroAddress',
    type: 'error'
  },
  {
    inputs: [],
    name: 'MintZeroQuantity',
    type: 'error'
  },
  {
    inputs: [],
    name: 'MinterRegistrationInvalid',
    type: 'error'
  },
  {
    inputs: [],
    name: 'MismatchedArrayLengths',
    type: 'error'
  },
  {
    inputs: [],
    name: 'NotMinter',
    type: 'error'
  },
  {
    inputs: [],
    name: 'OverLimitSupply',
    type: 'error'
  },
  {
    inputs: [],
    name: 'OwnerQueryForNonexistentToken',
    type: 'error'
  },
  {
    inputs: [],
    name: 'OwnershipNotInitializedForExtraData',
    type: 'error'
  },
  {
    inputs: [],
    name: 'RoyaltyBPSInvalid',
    type: 'error'
  },
  {
    inputs: [],
    name: 'RoyaltySetBlocked',
    type: 'error'
  },
  {
    inputs: [],
    name: 'TokenDoesNotExist',
    type: 'error'
  },
  {
    inputs: [],
    name: 'TokenNotInRange',
    type: 'error'
  },
  {
    inputs: [],
    name: 'TransferCallerNotOwnerNorApproved',
    type: 'error'
  },
  {
    inputs: [],
    name: 'TransferFromIncorrectOwner',
    type: 'error'
  },
  {
    inputs: [],
    name: 'TransferToNonERC721ReceiverImplementer',
    type: 'error'
  },
  {
    inputs: [],
    name: 'TransferToZeroAddress',
    type: 'error'
  },
  {
    inputs: [],
    name: 'URIQueryForNonexistentToken',
    type: 'error'
  },
  {
    inputs: [],
    name: 'Unauthorized',
    type: 'error'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'owner',
        type: 'address'
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'approved',
        type: 'address'
      },
      {
        indexed: true,
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256'
      }
    ],
    name: 'Approval',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'owner',
        type: 'address'
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'operator',
        type: 'address'
      },
      {
        indexed: false,
        internalType: 'bool',
        name: 'approved',
        type: 'bool'
      }
    ],
    name: 'ApprovalForAll',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'string',
        name: 'oldBaseUri',
        type: 'string'
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'newBaseURI',
        type: 'string'
      }
    ],
    name: 'BaseURISet',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'recipientAddress',
        type: 'address'
      },
      {
        indexed: true,
        internalType: 'uint16',
        name: 'royaltyPercentageBPS',
        type: 'uint16'
      }
    ],
    name: 'DefaultRoyaltySet',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'newDefaultTokenManager',
        type: 'address'
      }
    ],
    name: 'DefaultTokenManagerChanged',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256[]',
        name: 'ids',
        type: 'uint256[]'
      },
      {
        components: [
          {
            internalType: 'address',
            name: 'recipientAddress',
            type: 'address'
          },
          {
            internalType: 'uint16',
            name: 'royaltyPercentageBPS',
            type: 'uint16'
          }
        ],
        indexed: false,
        internalType: 'struct IRoyaltyManager.Royalty[]',
        name: '_newRoyalties',
        type: 'tuple[]'
      }
    ],
    name: 'GranularRoyaltiesSet',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256[]',
        name: '_ids',
        type: 'uint256[]'
      }
    ],
    name: 'GranularTokenManagersRemoved',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256[]',
        name: '_ids',
        type: 'uint256[]'
      },
      {
        indexed: false,
        internalType: 'address[]',
        name: '_tokenManagers',
        type: 'address[]'
      }
    ],
    name: 'GranularTokenManagersSet',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint8',
        name: 'version',
        type: 'uint8'
      }
    ],
    name: 'Initialized',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: 'newLimitSupply',
        type: 'uint256'
      }
    ],
    name: 'LimitSupplySet',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'minter',
        type: 'address'
      },
      {
        indexed: true,
        internalType: 'bool',
        name: 'registered',
        type: 'bool'
      }
    ],
    name: 'MinterRegistrationChanged',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [],
    name: 'MintsFrozen',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'previousOwner',
        type: 'address'
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'newOwner',
        type: 'address'
      }
    ],
    name: 'OwnershipTransferred',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'newRoyaltyManager',
        type: 'address'
      }
    ],
    name: 'RoyaltyManagerChanged',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256[]',
        name: 'ids',
        type: 'uint256[]'
      },
      {
        indexed: false,
        internalType: 'string[]',
        name: 'uris',
        type: 'string[]'
      }
    ],
    name: 'TokenURIsSet',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'from',
        type: 'address'
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'to',
        type: 'address'
      },
      {
        indexed: true,
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256'
      }
    ],
    name: 'Transfer',
    type: 'event'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'to',
        type: 'address'
      },
      {
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256'
      }
    ],
    name: 'approve',
    outputs: [],
    stateMutability: 'payable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'owner',
        type: 'address'
      }
    ],
    name: 'balanceOf',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'baseURI',
    outputs: [
      {
        internalType: 'string',
        name: '',
        type: 'string'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256'
      }
    ],
    name: 'burn',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'contractURI',
    outputs: [
      {
        internalType: 'string',
        name: '',
        type: 'string'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'defaultManager',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'bytes',
        name: 'data',
        type: 'bytes'
      },
      {
        internalType: 'bytes',
        name: 'key',
        type: 'bytes'
      }
    ],
    name: 'encryptDecrypt',
    outputs: [
      {
        internalType: 'bytes',
        name: 'result',
        type: 'bytes'
      }
    ],
    stateMutability: 'pure',
    type: 'function'
  },
  {
    inputs: [],
    name: 'freezeMints',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256'
      }
    ],
    name: 'getApproved',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'bytes',
        name: 'data',
        type: 'bytes'
      }
    ],
    name: 'initialize',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'creator',
        type: 'address'
      },
      {
        internalType: 'string',
        name: '_contractURI',
        type: 'string'
      },
      {
        components: [
          {
            internalType: 'address',
            name: 'recipientAddress',
            type: 'address'
          },
          {
            internalType: 'uint16',
            name: 'royaltyPercentageBPS',
            type: 'uint16'
          }
        ],
        internalType: 'struct IRoyaltyManager.Royalty',
        name: 'defaultRoyalty',
        type: 'tuple'
      },
      {
        internalType: 'address',
        name: '_defaultTokenManager',
        type: 'address'
      },
      {
        internalType: 'string',
        name: '_name',
        type: 'string'
      },
      {
        internalType: 'string',
        name: '_symbol',
        type: 'string'
      },
      {
        internalType: 'address',
        name: 'trustedForwarder',
        type: 'address'
      },
      {
        internalType: 'address',
        name: 'initialMinter',
        type: 'address'
      },
      {
        internalType: 'string',
        name: 'newBaseURI',
        type: 'string'
      },
      {
        internalType: 'uint256',
        name: '_limitSupply',
        type: 'uint256'
      },
      {
        internalType: 'bool',
        name: 'useMarketplaceFiltererRegistry',
        type: 'bool'
      },
      {
        internalType: 'address',
        name: '_observability',
        type: 'address'
      }
    ],
    name: 'initialize',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'owner',
        type: 'address'
      },
      {
        internalType: 'address',
        name: 'operator',
        type: 'address'
      }
    ],
    name: 'isApprovedForAll',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'forwarder',
        type: 'address'
      }
    ],
    name: 'isTrustedForwarder',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'limitSupply',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'recipient',
        type: 'address'
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256'
      }
    ],
    name: 'mintAmountToOneRecipient',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'address[]',
        name: 'recipients',
        type: 'address[]'
      }
    ],
    name: 'mintOneToMultipleRecipients',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'recipient',
        type: 'address'
      }
    ],
    name: 'mintOneToOneRecipient',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'address[]',
        name: 'recipients',
        type: 'address[]'
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256'
      }
    ],
    name: 'mintSameAmountToMultipleRecipients',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'recipient',
        type: 'address'
      },
      {
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256'
      }
    ],
    name: 'mintSpecificTokenToOneRecipient',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'recipient',
        type: 'address'
      },
      {
        internalType: 'uint256[]',
        name: 'tokenIds',
        type: 'uint256[]'
      }
    ],
    name: 'mintSpecificTokensToOneRecipient',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'minters',
    outputs: [
      {
        internalType: 'address[]',
        name: '',
        type: 'address[]'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'name',
    outputs: [
      {
        internalType: 'string',
        name: '',
        type: 'string'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'observability',
    outputs: [
      {
        internalType: 'contract IObservability',
        name: '',
        type: 'address'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256'
      }
    ],
    name: 'ownerOf',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'minter',
        type: 'address'
      }
    ],
    name: 'registerMinter',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'removeDefaultTokenManager',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'uint256[]',
        name: '_ids',
        type: 'uint256[]'
      }
    ],
    name: 'removeGranularTokenManagers',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'removeRoyaltyManager',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_tokenGroupingId',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: '_salePrice',
        type: 'uint256'
      }
    ],
    name: 'royaltyInfo',
    outputs: [
      {
        internalType: 'address',
        name: 'receiver',
        type: 'address'
      },
      {
        internalType: 'uint256',
        name: 'royaltyAmount',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'royaltyManager',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'from',
        type: 'address'
      },
      {
        internalType: 'address',
        name: 'to',
        type: 'address'
      },
      {
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256'
      }
    ],
    name: 'safeTransferFrom',
    outputs: [],
    stateMutability: 'payable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'from',
        type: 'address'
      },
      {
        internalType: 'address',
        name: 'to',
        type: 'address'
      },
      {
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256'
      },
      {
        internalType: 'bytes',
        name: '_data',
        type: 'bytes'
      }
    ],
    name: 'safeTransferFrom',
    outputs: [],
    stateMutability: 'payable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'operator',
        type: 'address'
      },
      {
        internalType: 'bool',
        name: 'approved',
        type: 'bool'
      }
    ],
    name: 'setApprovalForAll',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: 'newBaseURI',
        type: 'string'
      }
    ],
    name: 'setBaseURI',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: 'newName',
        type: 'string'
      },
      {
        internalType: 'string',
        name: 'newSymbol',
        type: 'string'
      },
      {
        internalType: 'string',
        name: 'newContractUri',
        type: 'string'
      }
    ],
    name: 'setContractMetadata',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: 'address',
            name: 'recipientAddress',
            type: 'address'
          },
          {
            internalType: 'uint16',
            name: 'royaltyPercentageBPS',
            type: 'uint16'
          }
        ],
        internalType: 'struct IRoyaltyManager.Royalty',
        name: '_royalty',
        type: 'tuple'
      }
    ],
    name: 'setDefaultRoyalty',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '_defaultTokenManager',
        type: 'address'
      }
    ],
    name: 'setDefaultTokenManager',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'uint256[]',
        name: 'ids',
        type: 'uint256[]'
      },
      {
        components: [
          {
            internalType: 'address',
            name: 'recipientAddress',
            type: 'address'
          },
          {
            internalType: 'uint16',
            name: 'royaltyPercentageBPS',
            type: 'uint16'
          }
        ],
        internalType: 'struct IRoyaltyManager.Royalty[]',
        name: '_newRoyalties',
        type: 'tuple[]'
      }
    ],
    name: 'setGranularRoyalties',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'uint256[]',
        name: '_ids',
        type: 'uint256[]'
      },
      {
        internalType: 'address[]',
        name: '_tokenManagers',
        type: 'address[]'
      }
    ],
    name: 'setGranularTokenManagers',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_limitSupply',
        type: 'uint256'
      }
    ],
    name: 'setLimitSupply',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '_royaltyManager',
        type: 'address'
      }
    ],
    name: 'setRoyaltyManager',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'uint256[]',
        name: 'ids',
        type: 'uint256[]'
      },
      {
        internalType: 'string[]',
        name: 'uris',
        type: 'string[]'
      }
    ],
    name: 'setTokenURIs',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'bytes4',
        name: 'interfaceId',
        type: 'bytes4'
      }
    ],
    name: 'supportsInterface',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [
      {
        internalType: 'string',
        name: '',
        type: 'string'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'id',
        type: 'uint256'
      }
    ],
    name: 'tokenManager',
    outputs: [
      {
        internalType: 'address',
        name: 'manager',
        type: 'address'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256'
      }
    ],
    name: 'tokenURI',
    outputs: [
      {
        internalType: 'string',
        name: '',
        type: 'string'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'from',
        type: 'address'
      },
      {
        internalType: 'address',
        name: 'to',
        type: 'address'
      },
      {
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256'
      }
    ],
    name: 'transferFrom',
    outputs: [],
    stateMutability: 'payable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'newOwner',
        type: 'address'
      }
    ],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'minter',
        type: 'address'
      }
    ],
    name: 'unregisterMinter',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  }
];
