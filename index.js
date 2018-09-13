'use strict'
const alfy = require('alfy')
const jsonfile = require('jsonfile')

const set = require('./src/cmd/set')
const del = require('./src/cmd/del')
const refresh = require('./src/cmd/refresh')
const decks = require('./src/anki/anki-decks')
const WorkflowError = require('./src/utils/error')
const {errorAction} = require('./src/utils/error')
const {modelExist} = require('./src/anki/anki-decks')
const searchContext = require('./src/api/rev-search')
const favorites = require('./src/api/rev-favourites')
const ankiInfo = require('./src/anki/anki-info')

const commands = [set, del, refresh]
const fileAnkiDecks = './src/input/anki-decks.json'

const introMessage = [{
	subtitle: `Current deck is ⇒ ${alfy.config.get('default-deck')}`
}]
introMessage[0].title = 'Search phrases ...'
introMessage[0].icon = {path: './icons/anki.png'}

const option = async input => {
	for (const command of commands) {
		if (command.match(input)) {
			return command(input)
		}
	}

	// No matches, show all commands
	if (/!.*/.test(input)) {
		const options = commands.map(command => ({
			title: command.meta.name,
			subtitle: `${command.meta.help} | Usage: ${command.meta.usage}`,
			autocomplete: command.meta.autocomplete,
			text: {
				largetype: `${command.meta.help} | Usage: ${command.meta.usage}`
			},
			icon: command.meta.icon,
			valid: false
		}))
		return alfy.inputMatches(options, 'title')
	}

	if (input === '') {
		const ankiModelExist = await modelExist()
		if (ankiModelExist.message) {
			throw new WorkflowError('Decks was not found, check your Anki profile', errorAction('modelExist'))
		}
		const ankiDecks = await decks()
		if (ankiDecks === null) {
			throw new WorkflowError('Decks was not found, check your Anki profile', errorAction('profile'))
		}
		jsonfile.writeFile(fileAnkiDecks, ankiDecks, {
			spaces: 2
		}, err => {
			if (err !== null) {
				console.log(err)
			}
		})
		return introMessage
	}
}

(async () => {
	try {
		if (/!.*/.test(alfy.input) || alfy.input === '') {
			const out = await option(alfy.input)
			alfy.output(out)
		} else if (/\*.*/.test(alfy.input)) {
			const fav = await favorites.fetching(alfy.input)
			alfy.input = alfy.input.replace(/^\*/g, '')
			alfy.output(fav)
			const variantsAll = alfy.inputMatches(fav, 'title').map(x => ({
				arg: x.arg
			})).filter(x => x.arg)
			alfy.config.set('allPhrases', variantsAll.map(x => JSON.parse(x.arg)))
		} else {
			const encodeInput = encodeURIComponent(alfy.input.normalize())
			await searchContext.fetching(encodeInput)
		}
	} catch (error) {
		alfy.output([await ankiInfo()])
	}
})()
