const axios = require('axios');

// Define the environment variables
const BACKEND_API_KEY = process.env['BACKEND_API_KEY'];
const BE_API_BASE_URL = process.env['BE_API_BASE_URL'];
const changelogs = process.env['CHANGELOGS'];
const versionNumber = process.env['VERSION_NUMBER'];
const buildNumber = process.env['BUILD_NUMBER'];
const platform = process.env['PLATFORM'];
const forceUpdate = process.env['FORCE_UPDATE'] === 'Yes';
const gitCommit = process.env['GITHUB_SHA'];
const releaseDate = Date.now() / 1000;
const currentVersion = '/v1';

// Function to get version by buildNumber
async function getVersionByBuildNumber() {
  try {
    const response = await axios.get(
      `${BE_API_BASE_URL}${currentVersion}/versions/`,
      {
        params: {
          buildNumber,
          versionNumber,
        },
        headers: {
          apikey: BACKEND_API_KEY,
        },
      },
    );
    return response.data;
  } catch (error) {
    console.error('Error getting version:', error);
    return null;
  }
}

// Function to create a new version
async function createVersion() {
  try {
    const response = await axios.post(
      `${BE_API_BASE_URL}${currentVersion}/versions/`,
      {
        versionNumber,
        buildNumber,
        platforms: platform,
        releaseDate,
        gitCommit,
        changelogs,
        forceUpdate,
      },
      {
        headers: {
          apikey: BACKEND_API_KEY,
        },
      },
    );
    return response.data;
  } catch (error) {
    console.error('Error creating version:', error);
    return null;
  }
}

// Function to update an existing version
async function updateVersion(data: any) {
  const updatePlatform = data.platforms.includes(platform)
    ? data.platforms
    : `${platform},${data.platforms}`;
  console.log('Setting platform to:', updatePlatform);
  try {
    const response = await axios.put(
      `${BE_API_BASE_URL}${currentVersion}/versions/${data.id}`,
      {
        versionNumber,
        buildNumber,
        changelogs,
        gitCommit,
        platforms: updatePlatform,
        forceUpdate: forceUpdate ? true : undefined,
      },
      {
        headers: {
          apikey: BACKEND_API_KEY,
        },
      },
    );
    return response.data;
  } catch (error) {
    console.error('Error updating version:', error);
    return null;
  }
}

// Main function to handle the logic
async function main() {
  const existingVersion = await getVersionByBuildNumber();
  console.log('Existing Version:', existingVersion);
  if (
    existingVersion &&
    existingVersion.data &&
    existingVersion.data.length > 0
  ) {
    console.log('Version exists. Updating...');
    const updatedVersion = await updateVersion(existingVersion.data[0]);
    console.log('Updated Version:', updatedVersion);
  } else {
    console.log('Version does not exist. Creating new version...');
    const newVersion = await createVersion();
    console.log('Created Version:', newVersion);
  }
}

main();
