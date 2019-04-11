/* eslint camelcase: ["error", {properties: "never"}] */
/* eslint no-extend-native: ["error", { "exceptions": ["String"] }] */
/* eslint quotes: ["error", "single", { "allowTemplateLiterals": true }] */

const fs = require('fs')
const request = require('request-promise')
const streamToPromise = require('stream-to-promise')

const config = require('../config')
const getOddcast = require('../utils/oddcast')

const {srcContext} = process.env
const {trgContext} = process.env

const defExist = data => data.srcSegment !== '' && data.srcContext[0] !== ''
const onlySrcContext = data => data.srcSegment === '' && data.srcContext[0] !== ''

/* eslint-disable-next-line no-use-extend-native/no-use-extend-native */
String.prototype.replaceAll = function (search, replacement) {
	const target = this
	return target.replace(new RegExp(search, 'gi'), replacement)
}

const clearText = example => {
	example = example
		.replaceAll(/<em.*?>|<\/em>/, '')
		.replaceAll(/c\//, '')
		.replaceAll(/^\s/, '')
	return example
}

module.exports = data => {
	data.srcContext = removeDuplicates(data.srcContext)
	data.trgContext = removeDuplicates(data.trgContext)
	data.toOddcast = removeDuplicates(data.toOddcast)
	data.backInfo = removeDuplicates(data.backInfo)
	const body = {
		definitionForTranslate: [],
		definition: [],
		audioExamples: [],
		lexicalUnit: [],
		oddcast: {
			url: [],
			fileName: []
		},
		registerLabel: []
	}

	if (defExist(data) || onlySrcContext(data)) {
		body.definition.push(data.srcSegment)
		body.audioExamples = data.toOddcast
		body.audioExamples.forEach((example, i) => {
			body.audioExamples[i] = example
		})
	} else {
		body.definition.push('')
		body.definitionForTranslate.push(data.srcSegment)
	}

	let HTMLoutput = `<span class="newline Sense"><span class="DEF">${body.definition}</span>`
	let HTMLoutputBack = ''

	/* -----------------------------
	Audio
	-------------------------------*/
	const textToAudio = body.definitionForTranslate.length > 0 ? body.definitionForTranslate : body.audioExamples
	let revExample
	if (srcContext !== data.currentSrc) {
		revExample = data.srcContext
	}
	if (textToAudio[0] !== '') {
		textToAudio.forEach((example, i) => {
			if (trgContext === 'hebrew') {
				HTMLoutput += `<span class="EXAMPLE">${revExample ? revExample[i] : example}</span>`
				HTMLoutputBack += `<span class="EXAMPLE">${data.backInfo[i] ? data.backInfo[i] : ''}</span>`
			} else {
				const runOddcast = getOddcast(clearText(example))
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
				HTMLoutput += `<span class="EXAMPLE"><span class="speaker exafile fa fa-volume-up">[sound:${runOddcast.id}.mp3]</span>${revExample ? revExample[i] : example}</span>`
				HTMLoutputBack += `<span class="EXAMPLE"><span class="speaker exafile fa fa-volume-up">[sound:${runOddcast.id}.mp3]</span>${data.backInfo[i] ? data.backInfo[i] : ''}</span>`
			}
		})
		HTMLoutput += '</span>'
		HTMLoutputBack += '</span>'
	}
	return {
		output: HTMLoutput.replaceAll(/\/v2\/.*?exa_pron\/(.*?mp3)/, `[sound:$1]`),
		outputBack: HTMLoutputBack.replaceAll(/\/v2\/.*?exa_pron\/(.*?mp3)/, `[sound:$1]`),
		definition: body.definition,
		definitionForTranslate: body.definitionForTranslate
	}
}
function removeDuplicates(arr) {
	const uniqueArray = []
	const data = []
	arr.forEach(elem => {
		if (uniqueArray.indexOf(elem) === -1) {
			uniqueArray.push(elem)
			data.push(elem)
		}
	})
	return data
}
