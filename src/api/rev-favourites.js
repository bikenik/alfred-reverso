'use strict'
const alfy = require('alfy')
const WorkflowError = require('../utils/error')
const ankiInfo = require('../anki/anki-info')
const Render = require('../utils/engine')
const {errorAction} = require('../utils/error')
const {languagesShortName} = require('../utils/oddcast')

const addToItems = new Render()

const {srcContext} = process.env
const {trgContext} = process.env
const {userName} = process.env

const srcExist = languagesShortName.filter(x => Object.keys(x)[0] === srcContext)[0][srcContext]

const joinTheSameItems = arr => {
	const uniqueArray = []
	const data = []
	arr.forEach(elem => {
		if (uniqueArray.indexOf(elem.srcText) === -1) {
			uniqueArray.push(elem.srcText)
			data.push(elem)
		} else if (data.last().srcContext.last() !== elem.srcContext[0]) {
			data.last().srcContext.push(elem.srcContext[0])
			data.last().trgContext.push(elem.trgContext[0])
		}
	})
	return data
}

const exampleNotExist = data => data.srcContext[0] === '' && data.srcSegment === ''
module.exports.fetching = async input => {
	const quickLook = ''
	const resolveThis = await alfy
		.fetch(`http://context.reverso.net/user-profile/user-public-favourites?mode=0&user_name=${userName}&start=0&length=10000&options=&order[0][column]=5&order[0][dir]=desc`)
		.then(async data => {
			data.data.forEach(x => {
				x.srcContext = [x.srcContext]
				x.trgContext = [x.trgContext]
				x.backInfo = []
				x.largeText = []
			})
			const replaceEM = target => target.replaceAll('<em.*?>', ' (').replaceAll('</em>', ') ')
			data.data = joinTheSameItems(data.data)
			data.data.forEach(x => x.srcContext.forEach((y, i) => {
				x.largeText.push(`${replaceEM(y)}\n\t\t↳ ${replaceEM(x.trgContext[i])}`)
				if (x.srcContext[i] && x.srcContext[i] !== '') {
					x.backInfo.push(`${x.srcContext[i]}<br>    ↳ ${x.trgContext[i]}`)
				}
			}))
			const ankiInfoRes = await ankiInfo()
			addToItems.items.push(ankiInfoRes[0] ? ankiInfoRes[0] : ankiInfoRes)
			for (const x of data.data) {
				x.currentSrc = x.srcLang === srcExist ? trgContext : srcContext
				x.toOddcast = x.srcLang === srcExist ? x.trgContext : x.srcContext
				addToItems.add(
					new Render('list of favorite',
						{title: `${x.srcText}\n ↳ ${x.trgText}`},
						{subtitle: x.largeText.join('\n🔑 ').replace(/<em.*?>|<\/em>/g, '') || x.srcSegment},
						{sentence: x.srcSegment ? `${x.srcSegment} ${x.comment === null || x.comment === '' ? '' : `\n✏️ ${x.comment}\n`} ${x.documentTitle ? `\n\t\t🌍 ${x.documentTitle}` : ''}` : 'not offer target from context'},
						{text: null},
						{icon: exampleNotExist(x) ? './icons/red-flag.png' : './icons/flag.png'},
						{arg: x},
						{valid: exampleNotExist(x) ? false : null},
						{mods: null},
						{
							variables: {
								action: 'dic',
								mode: 'regular',
								validOutput: alfy.cache.get('validOutput') === 'true' ? 'true' : 'false',
								type: 'regular',
								currentSense: x.largeText
							}
						}
					))
			}

			return alfy.matches(input.replace(/^\*/g, ''), addToItems.items, 'title')
				.map(x => ({
					title: x.title,
					subtitle: x.subtitle,
					arg: JSON.stringify(x.arg, '', 2),
					icon: x.icon,
					text: x.text,
					variables: x.variables,
					autocomplete: x.autocomplete,
					quickLook: x.quickLook,
					mods: x.mods
				}))
		})
		.catch(error => {
			throw new WorkflowError(error, errorAction('main'))
		})
	module.exports.quicklookurl = {
		quickLook
	}
	return resolveThis
}
