const codeLists = {}
const cache = {}

/**
 * Retrieves the data from the given URL in JSON format.
 *
 * @async
 * @param {string} url - The URL from which to fetch the JSON data.
 * @returns {Promise} - A Promise that resolves to the JSON data retrieved from the URL.
 */
const getJson = async (url) => {
  if (!!cache[url]) {
    return cache[url]
  }
  cache[url] = await (await fetch(url)).json()
  return cache[url]
};

/**
 * Fetches and stores a single code list from a given base URL, SDK version, and filename.
 *
 * @async
 * @param {string} baseUrl - The base URL to fetch code lists from.
 * @param {string} sdkVersion - The SDK version of the code lists.
 * @param {string} filename - The filename of the code lists to fetch.
 * @returns {Promise} - A promise that resolves when code lists are fetched and stored.
 */
export const fetchCodeList = async (baseUrl, sdkVersion, filename) => {
  const codeListsUrl = `${baseUrl}/sdk/${sdkVersion}/codelists/${filename}/lang/en`;
  if (!codeLists[filename]) {
    codeLists[filename] = await getJson(codeListsUrl);
  }
}

/**
 * Retrieve the code list associated with the given filename.
 *
 * @param {string} filename - The name of the code list file.
 * @returns {Array|undefined} - The code list associated with the filename, or undefined if not found.
 */
export const getCodeList = (filename) => codeLists[filename]

export const mapListToIdKeys = (list) => {
  return Object.fromEntries(list.map(item => [item.id, item]))
}

/**
 * Fetches the field metadata from the specified base URL and SDK version.
 *
 * @async
 * @param {string} baseUrl - The base URL to fetch the metadata from.
 * @param {string} sdkVersion - The SDK version to fetch the metadata for.
 * @returns {Promise<Object>} - A Promise that resolves to the fetched metadata object.
 */
export const fetchFieldMetadata = async (baseUrl, sdkVersion) => getJson(`${baseUrl}/sdk/${sdkVersion}/basic-meta-data`);