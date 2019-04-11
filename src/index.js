/* eslint camelcase: ["error", {properties: "never"}] */
/* eslint camelcase: ["error", {properties: "never"}] */
/* eslint-parserOptions: {"ecmaVersion: 2017"} */
'use strict'
const fs = require('fs')
const request = require('request-promise')
const jsonfile = require('jsonfile')
const translate = require('google-translate-api')
const streamToPromise = require('stream-to-promise')
const pMap = require('p-map')

const ankiAddCard = require('./anki/anki-add-card')
const {canAddNotes} = require('./anki/anki-add-card')
const mydata = require('./api/mydata')
const getOddcast = require('./utils/oddcast')
const config = require('./config')
const {languagesShortName} = require('./utils/oddcast')

const {srcContext} = process.env
const {trgContext} = process.env

const language = languagesShortName.filter(x => Object.keys(x)[0] === srcContext)[0][srcContext]

const joinTheSameItems = arr => {
	const uniqueArray = []
	const data = []
	arr.forEach(elem => {
		if (uniqueArray.indexOf(elem.srcText) === -1) {
			uniqueArray.push(elem.srcText)
			data.push(elem)
		} else {
			data[data.length - 1].srcContext.push(elem.srcContext[0])
			data[data.length - 1].trgContext.push(elem.trgContext[0])
			data[data.length - 1].toOddcast.push(elem.toOddcast[0])
			data[data.length - 1].backInfo.push(elem.backInfo[0])
		}
	})
	return data
}

async function main() {
	setupDirStructure()
	let inputCollection = jsonfile.readFileSync(config.input)
	inputCollection = joinTheSameItems(inputCollection)
	const cleanedInput = cleanInput(inputCollection)
	const check = await canAddNotes(cleanedInput)
	const output = check[0] ? await processInput(cleanedInput) : cleanedInput.map(x => {
		return [{
			Headword: `${x.Headword}${x.Homnum ? `<span class="HOMNUM-title">${
				x.Homnum.toString()}</span>` : ''}`,
			Audio: '',
			Translation: '',
			Example: '',
			Image: '',
			Verb_table: '',
			Tag: [x.Part_of_speech]
		}]
	})[0]
	await ankiAddCard(output)
}

function setupDirStructure() {
	fs.existsSync(config.mediaDir)
	// "console.log(chalk.green('Success your media folder path!', config.mediaDir))"
}

function cleanInput(input) {
	const deUndefinedArray = input
		.filter(card => card.id !== undefined || card.srcText !== undefined)
	const deDupedArray = removeDuplicates(deUndefinedArray, 'id')
	return deDupedArray
}

async function processInput(input) {
	const mapper = async card => {
		const getHtmlOutput = mydata(card)
		const data = await getData(card, getHtmlOutput)
		const modifiedCard = card
		Object.assign(modifiedCard, data)
		return modifiedCard
	}

	const result = await pMap(input, mapper, {
		concurrency: config.concurrency
	})
	return result
}

async function getData(card, getHtmlOutput) {
	const {definitionForTranslate} = getHtmlOutput

	/* -----------------------------
	AudioFileName
 -------------------------------*/
	let audioField
	if (srcContext === card.currentSrc && trgContext !== 'hebrew') {
		const runOddcast = getOddcast(card.srcText)
		const wrightFiles = async () => {
			const writeStreamExp = fs.createWriteStream(
				`${config.mediaDir}/${runOddcast.id}.mp3`
			)
			request(runOddcast.options)
				.pipe(writeStreamExp)
			await streamToPromise(writeStreamExp)
			writeStreamExp.end()
		}

		wrightFiles()
		audioField = `${card.srcText} <span class="speaker brefile fa fa-volume-up">[sound:${runOddcast.id}.mp3]</span><br>`
	} else {
		audioField = `${card.srcText} <span class="speaker brefile fa fa-volume-up"></span><br>`
	}

	// Translation
	let translation = ''
	/* eslint-disable no-await-in-loop */
	if (getHtmlOutput.definition[0] === '') {
		for (let z = 0; z < definitionForTranslate.length; z++) {
			const translated = await translate(definitionForTranslate[z], {
				from: 'en',
				to: language
			})
			translation += translated.text + ' | '
		}
	} else {
		translation += card.trgContext.join(' | ')
	}
	/* eslint-enable no-await-in-loop */
	// "console.log(chalk.blue('Translate: '), translation)"

	if (!card.Part_of_speech) {
		card.Part_of_speech = ''
	}

	return {
		Headword: card.srcText,
		Audio: audioField,
		Translation: translation,
		Example: getHtmlOutput.output,
		Image: '',
		Back_info: card.backInfo.length > 0 ? getHtmlOutput.outputBack : `${getHtmlOutput.output.replace(/<\/span><\/span>$/g, `<br>\t↳ ${translation.replace(/\|\s$/g, '').trim()}</span></span>`)}`,
		Comment: card.comment === null || card.comment === '' ? '' : card.comment,
		Document: !card.document || card.document === '' ? '' : `<a href=${card.document}>${card.documentTitle}</a>`,
		Tag: 'reverso'
	}
}

function removeDuplicates(myArr, prop) {
	return myArr.filter((obj, pos, arr) => {
		return arr.map(mapObj => mapObj[prop]).indexOf(obj[prop]) === pos
	})
}

main()
