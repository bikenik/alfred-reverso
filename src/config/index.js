/* eslint camelcase: ["error", {properties: "never"}] */
/* eslint-disable camelcase */
const os = require('os')

const user = os.userInfo()
const {path_to_ankiMedia} = process.env

module.exports = {
	concurrency: 10,
	input: './src/input/body.json',
	body: './src/input/body.json',
	fields: {
		headword: 'Headword',
		audio: 'Audio',
		translation: 'Translation',
		example: 'Example',
		image: 'Image',
		back_info: 'Back_info',
		comment: 'Comment',
		document: 'Document',
		tag: 'Tag'
	},
	get mediaDir() {
		return user.homedir + path_to_ankiMedia
	},
	decks: {
		defaults: {
			'default-deck': 'Default'
		},
		delete: {
			'delete-deck': 'choose ...'
		},
		refresh: {
			'refreshing...': 'refreshings ...'
		},
		theme: {
			'change theme': 'toogle ...'
		}
	}
}
