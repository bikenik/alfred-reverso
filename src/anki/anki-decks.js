/* eslint-disable camelcase */
const alfy = require('alfy')

const WorkflowError = require('../utils/error')
const {errorAction} = require('../utils/error')
const ankiConnect = require('./anki-connect')

const note_types = [process.env.note_type, process.env.note_type_reverse]
module.exports = () => {
	const outresult = async function () {
		try {
			alfy.cache.set('validOutput', 'true')
			const resultAll = await ankiConnect('deckNames', 6)
			return resultAll
		} catch (error) {
			alfy.cache.set('validOutput', 'false')
			throw new WorkflowError(error, errorAction('main'))
		}
	}
	return outresult()
}

module.exports.modelExist = () => {
	const outresult = async function () {
		/* eslint-disable no-await-in-loop */
		for (const note_type of note_types) {
			try {
				alfy.cache.set('validOutput', 'true')
				const resultAll = await ankiConnect('modelFieldNames', 6, {modelName: note_type})
				return resultAll
			} catch (error) {
				alfy.cache.set('validOutput', 'false')
				return new WorkflowError(error, error === 'failed to connect to AnkiConnect' ? errorAction('main') : error === 'collection is not available' ? errorAction('profile') : /model was not found/.test(error) ? errorAction('modelExist') : errorAction('main'))
			}
		}
		/* eslint-enable no-await-in-loop */
	}
	return outresult()
}

module.exports.render = async (pattern = '', autocomplete = () => undefined, ankiDecks, cmdIcon) => {
	const out = await alfy.matches(pattern, Object.getOwnPropertyNames(ankiDecks).sort())
		.map(name => ({
			title: name,
			subtitle: ankiDecks[name],
			autocomplete: autocomplete(name),
			valid: false,
			icon: {
				path: cmdIcon
			}
		}))
	if (out.length === 0) {
		out.push({
			title: `Create new Deck as '${pattern}'`,
			subtitle: `Old value ⇒ ${alfy.config.get('default-deck')}`,
			valid: true,
			arg: JSON.stringify({
				alfredworkflow: {
					variables: {
						action: 'set',
						/* eslint-disable camelcase */
						config_variable: 'default-deck',
						config_value: pattern
						/* eslint-enable camelcase */
					}
				}
			})
		})
		return out
	}
	return out
}
