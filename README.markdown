# FoundryVTT Discord Login

> `.markdown` extension is required to avoid overwritting the existing README.md provided by Foundry.

Guide with pictures: [How to add Discord Authentication to FoundryVTT ](https://dev.to/mbround18/how-to-add-discord-authentication-to-foundryvtt-5ch)

- Whats the point of this?

    With recent concern over foundry security, this tool was created to add an extra layer of security. It Adds a composite key of a few items rather than just an access key.

- What is in the composite key?

    The composite key now takes your discord snowflake ID, your email you use for discord, and an access key.

- This seems like more work, why use this?

    This is purely for those who have public facing FoundryVTT servers to combat potential brute forcing.

## Installation

1. Click the green Code button or clone the repo.
2. Extract or copy the files into the `resources` directory of your foundry server.
3. Edit the `public/scripts/discord.js` file and change the `changeme` to a discord application ID.

### How to get a discord application ID

1. Navigate to [discord.com/developers/applications](https://discord.com/developers/applications)
2. Log into your discord account.
3. Click new application.
4. Give it a name.
5. Add your application callback to the oauth section on discord.
6. Click copy on `APPLICATION ID`
7. Paste it into the `public/scripts/discord.js` in the `changeme` text.
8. Change the callback url to be your application.

## Usage

When logging into a world, you now have the two more fields on the user management field. In order for this to work you will need to copy a few things.

### Discord Username

This should be the username they have on discord. Example: `Banana Man#1234`

### Discord ID

You have to have developer mode enabled on discord to copy this! [Click here for an article on how to enable it](https://www.howtogeek.com/714348/how-to-enable-or-disable-developer-mode-on-discord/). Once enabled, you can right click on the user and paste it into FoundryVTT User Management section.

### Email

This should be the email they used to setup discord with.

### Access Key

> You can set just the access key and username fields. A user does NOT have to use discord authentication.

This is a password that they can use and is no different than the password that you would originally set.
