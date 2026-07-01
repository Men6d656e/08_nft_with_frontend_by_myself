// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ManualNFT
 * @author Akash
 * @notice A scratch-built, custom ERC-721 Non-Fungible Token contract with zero
 *         external dependencies. Every state ledger is implemented from first
 *         principles — no OpenZeppelin or other libraries are used.
 *
 * @dev This contract implements the core ERC-721 specification (including
 *      metadata extension, enumeration extension via ERC-721Enumerable, and
 *      ERC-165 introspection) entirely in raw Solidity. It provides a
 *      `mint` function that assigns a new token with a metadata URI to a
 *      recipient.
 *
 * Features:
 * - Total supply tracking
 * - Per-owner token enumeration
 * - Full token-level approval system
 * - Operator (batch) approval system
 * - Safe transfer support with ERC-721 receiver callback checking
 * - ERC-165 interface detection
 *
 * Custom Errors:
 * - NFT__NotAuthorized       – Caller lacks permission for the operation
 * - NFT__InvalidOwner        – The queried address is the zero address
 * - NFT__InvalidRecipient    – Transfer target is the zero address
 * - NFT__NonexistentToken    – The token does not exist
 * - NFT__TokenAlreadyMinted  – The token ID has already been assigned
 * - NFT__NonERC721Receiver   – The target contract does not implement onERC721Received
 */

/// @dev Interface identifier for ERC-721 Token Standard.
bytes4 constant _INTERFACE_ID_ERC721 = 0x80ac58cd;

/// @dev Interface identifier for ERC-721 Metadata Extension.
bytes4 constant _INTERFACE_ID_ERC721_METADATA = 0x5b5e139f;

/// @dev Interface identifier for ERC-721 Enumerable.
bytes4 constant _INTERFACE_ID_ERC721_ENUMERABLE = 0x780e9d63;

/// @dev Interface identifier for ERC-165.
bytes4 constant _INTERFACE_ID_ERC165 = 0x01ffc9a7;

/// @dev Magic return value for ERC-721 safe transfer callback.
bytes4 constant _ERC721_RECEIVED = 0x150b7a02;

/* -------------------------------------------------------------------------- */
/*                                   ERRORS                                   */
/* -------------------------------------------------------------------------- */

error NFT__NotAuthorized();
error NFT__InvalidOwner();
error NFT__InvalidRecipient();
error NFT__NonexistentToken();
error NFT__TokenAlreadyMinted();
error NFT__NonERC721Receiver();

/* -------------------------------------------------------------------------- */
/*                                   CONTRACT                                 */
/* -------------------------------------------------------------------------- */

contract ManualNFT {
    /* ---------------------------------------------------------------------- */
    /*                              STATE VARIABLES                           */
    /* ---------------------------------------------------------------------- */

    /// @notice Token name.
    string private _name;

    /// @notice Token symbol.
    string private _symbol;

    /// @notice Token ID counter / total supply.
    uint256 private _totalSupply;

    /// @notice Mapping from token ID to owner address.
    mapping(uint256 tokenId => address owner) private _owners;

    /// @notice Mapping from owner address to token balance.
    mapping(address owner => uint256 balance) private _balances;

    /// @notice Mapping from token ID to approved address.
    mapping(uint256 tokenId => address approved) private _tokenApprovals;

    /// @notice Mapping from owner to operator approvals.
    mapping(address owner => mapping(address operator => bool approved))
        private _operatorApprovals;

    /// @notice Mapping from token ID to metadata URI.
    mapping(uint256 tokenId => string uri) private _tokenURIs;

    /// @notice Array of all token IDs for enumeration.
    uint256[] private _allTokens;

    /// @notice Mapping from token ID to its index in the `_allTokens` array.
    mapping(uint256 tokenId => uint256 index) private _allTokensIndex;

    /// @notice Mapping from owner to list of owned token IDs.
    mapping(address owner => uint256[] tokens) private _ownedTokens;

    /// @notice Mapping from token ID to its index in the owner's token array.
    mapping(uint256 tokenId => uint256 index) private _ownedTokensIndex;

    /* ---------------------------------------------------------------------- */
    /*                                  EVENTS                                 */
    /* ---------------------------------------------------------------------- */

    /// @notice Emitted when a token is minted.
    /// @param to The address receiving the token.
    /// @param tokenId The ID of the minted token.
    /// @param uri The metadata URI of the token.
    event Minted(address indexed to, uint256 indexed tokenId, string uri);

    /* ---------------------------------------------------------------------- */
    /*                                 MODIFIERS                              */
    /* ---------------------------------------------------------------------- */

    /// @dev Reverts if the token does not exist.
    /// @param tokenId The token ID to check.
    modifier tokenExists(uint256 tokenId) {
        if (_owners[tokenId] == address(0)) revert NFT__NonexistentToken();
        _;
    }

    /// @dev Reverts if the caller is not authorized — not the owner, not
    ///      approved, and not an operator for the owner.
    /// @param tokenId The token ID to check authorization for.
    modifier onlyAuthorized(uint256 tokenId) {
        address owner = _owners[tokenId];
        if (
            msg.sender != owner
                && msg.sender != _tokenApprovals[tokenId]
                && !_operatorApprovals[owner][msg.sender]
        ) revert NFT__NotAuthorized();
        _;
    }

    /* ---------------------------------------------------------------------- */
    /*                               CONSTRUCTOR                              */
    /* ---------------------------------------------------------------------- */

    /// @notice Initializes the NFT contract with a name and symbol.
    /// @param name_ The token collection name.
    /// @param symbol_ The token collection symbol.
    constructor(string memory name_, string memory symbol_) {
        _name = name_;
        _symbol = symbol_;
    }

    /* ---------------------------------------------------------------------- */
    /*                            EXTERNAL VIEW FUNCTIONS                     */
    /* ---------------------------------------------------------------------- */

    /// @notice Returns the token collection name.
    /// @return The name of the token.
    function name() external view returns (string memory) {
        return _name;
    }

    /// @notice Returns the token collection symbol.
    /// @return The symbol of the token.
    function symbol() external view returns (string memory) {
        return _symbol;
    }

    /// @notice Returns the total number of tokens minted.
    /// @return The total supply.
    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }

    /// @notice Returns the number of tokens owned by `owner`.
    /// @param owner The address to query.
    /// @return The balance of the owner.
    function balanceOf(address owner) external view returns (uint256) {
        if (owner == address(0)) revert NFT__InvalidOwner();
        return _balances[owner];
    }

    /// @notice Returns the owner of token ID `tokenId`.
    /// @param tokenId The token ID to query.
    /// @return The owner address.
    function ownerOf(uint256 tokenId)
        external
        view
        tokenExists(tokenId)
        returns (address)
    {
        return _owners[tokenId];
    }

    /// @notice Returns the metadata URI for token ID `tokenId`.
    /// @param tokenId The token ID to query.
    /// @return The metadata URI string.
    function tokenURI(uint256 tokenId)
        external
        view
        tokenExists(tokenId)
        returns (string memory)
    {
        return _tokenURIs[tokenId];
    }

    /// @notice Returns the approved address for token ID `tokenId`, or
    ///         address(0) if none set.
    /// @param tokenId The token ID to query.
    /// @return The approved address.
    function getApproved(uint256 tokenId)
        external
        view
        tokenExists(tokenId)
        returns (address)
    {
        return _tokenApprovals[tokenId];
    }

    /// @notice Returns whether `operator` is approved to manage all tokens of
    ///         `owner`.
    /// @param owner The owner address.
    /// @param operator The operator address to check.
    /// @return Whether the operator is approved.
    function isApprovedForAll(address owner, address operator)
        external
        view
        returns (bool)
    {
        return _operatorApprovals[owner][operator];
    }

    /// @notice Returns a token ID at a given index of the all-tokens list.
    ///         Reverts if index >= totalSupply().
    /// @param index The index into the all-tokens array.
    /// @return The token ID at the given index.
    function tokenByIndex(uint256 index) external view returns (uint256) {
        if (index >= _totalSupply) revert NFT__NonexistentToken();
        return _allTokens[index];
    }

    /// @notice Returns a token ID owned by `owner` at a given index. Reverts
    ///         if index >= balanceOf(owner).
    /// @param owner The owner address.
    /// @param index The index into the owner's token array.
    /// @return The token ID at the given index.
    function tokenOfOwnerByIndex(address owner, uint256 index)
        external
        view
        returns (uint256)
    {
        if (index >= _balances[owner]) revert NFT__NonexistentToken();
        return _ownedTokens[owner][index];
    }

    /// @notice Checks whether this contract implements an interface via ERC-165.
    /// @param interfaceId The 4-byte interface identifier.
    /// @return True if the interface is supported.
    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return interfaceId == _INTERFACE_ID_ERC165
            || interfaceId == _INTERFACE_ID_ERC721
            || interfaceId == _INTERFACE_ID_ERC721_METADATA
            || interfaceId == _INTERFACE_ID_ERC721_ENUMERABLE;
    }

    /* ---------------------------------------------------------------------- */
    /*                            EXTERNAL WRITE FUNCTIONS                    */
    /* ---------------------------------------------------------------------- */

    /// @notice Mints a new token to `to` with the given metadata URI.
    /// @param to The recipient of the newly minted token.
    /// @param uri_ The metadata URI for the token.
    /// @return tokenId The ID of the newly minted token.
    function mint(address to, string memory uri_)
        external
        returns (uint256 tokenId)
    {
        if (to == address(0)) revert NFT__InvalidRecipient();

        uint256 newTokenId = _totalSupply + 1;

        _owners[newTokenId] = to;
        _tokenURIs[newTokenId] = uri_;
        _balances[to]++;

        // Add to all-tokens enumeration.
        _allTokens.push(newTokenId);
        _allTokensIndex[newTokenId] = _allTokens.length - 1;

        // Add to owner's token enumeration.
        _ownedTokens[to].push(newTokenId);
        _ownedTokensIndex[newTokenId] = _ownedTokens[to].length - 1;

        _totalSupply = newTokenId;

        emit Transfer(address(0), to, newTokenId);
        emit Minted(to, newTokenId, uri_);

        return newTokenId;
    }

    /// @notice Transfers token ID `tokenId` from `from` to `to`.
    /// @param from The current owner address.
    /// @param to The recipient address.
    /// @param tokenId The token ID to transfer.
    function transferFrom(address from, address to, uint256 tokenId)
        external
        onlyAuthorized(tokenId)
    {
        _transfer(from, to, tokenId);
    }

    /// @notice Safely transfers token ID `tokenId` from `from` to `to`,
    ///         checking that the recipient can receive ERC-721 tokens.
    /// @param from The current owner address.
    /// @param to The recipient address.
    /// @param tokenId The token ID to transfer.
    function safeTransferFrom(address from, address to, uint256 tokenId)
        external
        onlyAuthorized(tokenId)
    {
        _transfer(from, to, tokenId);
        _checkOnERC721Received(from, to, tokenId);
    }

    /// @notice Safely transfers token ID `tokenId` from `from` to `to` with
    ///         additional `data`.
    /// @param from The current owner address.
    /// @param to The recipient address.
    /// @param tokenId The token ID to transfer.
    /// @param data Additional data forwarded to the recipient.
    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes calldata data
    ) external onlyAuthorized(tokenId) {
        _transfer(from, to, tokenId);
        _checkOnERC721Received(from, to, tokenId, data);
    }

    /// @notice Approves `to` to transfer token ID `tokenId`.
    /// @param to The address to approve.
    /// @param tokenId The token ID to approve.
    function approve(address to, uint256 tokenId)
        external
        tokenExists(tokenId)
    {
        address owner = _owners[tokenId];
        if (msg.sender != owner && !_operatorApprovals[owner][msg.sender]) {
            revert NFT__NotAuthorized();
        }
        if (to == owner) revert NFT__InvalidRecipient();

        _tokenApprovals[tokenId] = to;
        emit Approval(owner, to, tokenId);
    }

    /// @notice Enables or disables an operator to manage all of the caller's
    ///         tokens.
    /// @param operator The operator to approve or revoke.
    /// @param approved True to approve, false to revoke.
    function setApprovalForAll(address operator, bool approved) external {
        if (operator == address(0)) revert NFT__InvalidRecipient();
        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    /* ---------------------------------------------------------------------- */
    /*                            INTERNAL FUNCTIONS                          */
    /* ---------------------------------------------------------------------- */

    /// @dev Internal transfer logic shared by all transfer functions.
    /// @param from The current owner.
    /// @param to The recipient.
    /// @param tokenId The token ID.
    function _transfer(address from, address to, uint256 tokenId) internal {
        if (from == address(0)) revert NFT__InvalidOwner();
        if (to == address(0)) revert NFT__InvalidRecipient();
        if (_owners[tokenId] != from) revert NFT__NotAuthorized();

        // Clear approvals.
        delete _tokenApprovals[tokenId];

        // Update owner's token enumeration: remove tokenId from from's list.
        uint256 tokenIndex = _ownedTokensIndex[tokenId];
        uint256 lastTokenIndex = _ownedTokens[from].length - 1;

        if (tokenIndex != lastTokenIndex) {
            uint256 lastTokenId = _ownedTokens[from][lastTokenIndex];
            _ownedTokens[from][tokenIndex] = lastTokenId;
            _ownedTokensIndex[lastTokenId] = tokenIndex;
        }

        _ownedTokens[from].pop();
        delete _ownedTokensIndex[tokenId];

        // Add to new owner's token enumeration.
        _ownedTokens[to].push(tokenId);
        _ownedTokensIndex[tokenId] = _ownedTokens[to].length - 1;

        // Update balances.
        _balances[from]--;
        _balances[to]++;

        // Update owner.
        _owners[tokenId] = to;

        emit Transfer(from, to, tokenId);
    }

    /// @dev Checks that `to` is an EOA or a contract that implements
    ///      `onERC721Received`. Reverts with NFT__NonERC721Receiver if not.
    /// @param from The source address.
    /// @param to The target address.
    /// @param tokenId The token ID.
    /// @param data Optional data to pass to the callback.
    function _checkOnERC721Received(
        address from,
        address to,
        uint256 tokenId,
        bytes memory data
    ) internal {
        if (to.code.length > 0) {
            (bool success, bytes memory returnData) = to.call(
                abi.encodeWithSelector(
                    _ERC721_RECEIVED, msg.sender, from, tokenId, data
                )
            );
            if (
                !success || returnData.length != 32
                    || abi.decode(returnData, (bytes4)) != _ERC721_RECEIVED
            ) {
                revert NFT__NonERC721Receiver();
            }
        }
    }

    /// @dev Convenience overload for `_checkOnERC721Received` without data.
    function _checkOnERC721Received(address from, address to, uint256 tokenId)
        internal
    {
        _checkOnERC721Received(from, to, tokenId, "");
    }

    /* ---------------------------------------------------------------------- */
    /*                           ERC-721 EVENTS                               */
    /* ---------------------------------------------------------------------- */

    /// @notice Emitted when a token transfer occurs.
    /// @param from The sender address.
    /// @param to The recipient address.
    /// @param tokenId The transferred token ID.
    event Transfer(
        address indexed from, address indexed to, uint256 indexed tokenId
    );

    /// @notice Emitted when a token approval is set.
    /// @param owner The token owner.
    /// @param approved The approved address.
    /// @param tokenId The approved token ID.
    event Approval(
        address indexed owner, address indexed approved, uint256 indexed tokenId
    );

    /// @notice Emitted when an operator approval is set.
    /// @param owner The token owner.
    /// @param operator The operator address.
    /// @param approved Whether the operator is approved.
    event ApprovalForAll(
        address indexed owner, address indexed operator, bool approved
    );
}
