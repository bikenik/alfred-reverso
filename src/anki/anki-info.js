const alfy = require('alfy')
const jsonfile = require('jsonfile')
const WorkflowError = require('../utils/error')
const decks = require('../anki/anki-decks')
const {modelExist} = require('../anki/anki-decks')
const {errorAction} = require('../utils/error')

const fileAnkiDecks = './src/input/anki-decks.json'

module.exports = async () => {
	const introMessage = [{
		subtitle: `Current deck is ⇒ ${alfy.config.get('default-deck')} | press ↹ to choose another`
	}]
	introMessage[0].title = 'Favourites'
	introMessage[0].icon = {path: './icons/anki.png'}
	introMessage[0].autocomplete = '!set default-deck '
	introMessage[0].valid = true

	const ankiModelExist = await modelExist()
	if (ankiModelExist && ankiModelExist.message) {
		return ankiModelExist
	}

	if (!ankiModelExist) {
		return errorAction('main')
	}

	const ankiDecks = await decks()
	if (ankiDecks === null) {
		throw new WorkflowError('Decks was not found, check your Anki profile', errorAction('profile'))
	}

	jsonfile.writeFile(fileAnkiDecks, ankiDecks, {
		spaces: 2
	}, error => {
		if (error !== null) {
			console.log(error)
		}
	})
	return introMessage
}
