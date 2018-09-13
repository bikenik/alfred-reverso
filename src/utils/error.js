/* eslint one-var: [2, { var: "always", let: "always" }] */
/* eslint quotes: ["error", "single", { "allowTemplateLiterals": true }] */

const alfy = require('alfy')

module.exports = class WorkflowError extends Error {
	constructor(message, data) {
		// `data` is an object with the following optional props:
		//   .tip - message to show so the user can fix the error
		//   .autocomplete - self-explanatory

		super(message)
		this.name = 'Workflow'

		Object.assign(this, data)
	}
}
module.exports.errorAction = reason => {
	let title, subtitle, autocomplete, text
	switch (reason) {
		case 'main':
			title = 'Searching without AnkiConnect'
			subtitle = '↵ Continue search | ⇧↵ to open Anki. | ⌘L to see the stack trace'
			text = {largetype: subtitle}
			break
		case 'profile':
			title = 'Collection is not available'
			subtitle = '⇧↵ to open Anki and choose profile. | ⌘L to see the stack trace'
			text = {largetype: subtitle}
			break
		case 'modelExist':
			title = 'model was not found'
			subtitle = `⇧↵ to open Anki & choose profile with "ReversoContext" or your own model.\n\nTo apply your own model - point it into Alfred's Workflow setting (Environment Variables: note_type = 'name of your own model')`
			text = {largetype: subtitle}
			break
		case '!set decks':
			title = null
			subtitle = '↵ Continue search | ⇧↵ to open Anki. | ⌘L to see the stack trace'
			text = {largetype: subtitle}
			autocomplete = '!set '
			break
		case '!del decks':
			title = null
			subtitle = '↵ Continue search | ⇧↵ to open Anki. | ⌘L to see the stack trace'
			text = {largetype: subtitle}
			autocomplete = '!del '
			break
		default:
			break
	}

	return {
		title,
		subtitle,
		autocomplete,
		text,
		mods: {
			shift: {
				variables: {
					run: 'anki'
				},
				valid: true,
				subtitle: 'Anki will be run'
			}
		},
		valid: false,
		icon: {
			path: './icons/not-connected.png'
		}
	}
}

module.exports.errorOut = err => {
	const messages = []

	if (err.tip) {
		messages.push(err.tip)
	}

	messages.push('Activate this item to try again.')
	messages.push('⌘L to see the stack trace')
	return [{
		title: err.title ? err.title : `${err.message}`,
		subtitle: err.subtitle ? err.subtitle : messages.join(' | '),
		autocomplete: err.autocomplete ? err.autocomplete : '',
		icon: err.icon ? err.icon : {
			path: alfy.icon.error
		},
		valid: err.valid ? err.valid : true,
		variables: err.variables ? err.variables : {},
		text: {
			largetype: `${err.subtitle}\n\n${err.stack}`,
			copy: err.stack
		},
		mods: err.mods ? err.mods : {
			mods: {}
		}
	}]
}
