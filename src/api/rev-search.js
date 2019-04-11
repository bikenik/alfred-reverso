const got = require('got')
const cheerio = require('cheerio')
const alfy = require('alfy')
const LanguageDetect = require('languagedetect')

const WorkflowError = require('../utils/error')
const Render = require('../utils/engine')
const {warning} = require('../utils/engine')
const {errorAction} = require('../utils/error')
const {languagesShortName} = require('../utils/oddcast')

const {srcContext} = process.env
const {trgContext} = process.env

const lngDetector = new LanguageDetect()

const srcRef = languagesShortName.filter(x => Object.keys(x)[0] === srcContext)[0][srcContext]
const trgRef = languagesShortName.filter(x => Object.keys(x)[0] === trgContext)[0][trgContext]

let quickLook = ''

function reversoURL(from, to, word) {
	return 'http://context.reverso.net/translation/' + from + '-' + to + '/' + word
}

async function getPairs(from, to, word) {
	quickLook = `http://context.reverso.net/translation/${from}-${to}/${word}`
	try {
		const res = await got(reversoURL(from, to, word))
		const $ = cheerio.load(res.body,
			{decodeEntities: false})

		const clean = function (i, elem) {
			return {
				[$(elem)[0].attribs.class.split(' ')[0]]: $(elem).children().last().html().trim().replace(/<a.*?>|<\/a>/gm, ''),
				lang: $(elem).children().last()[0].attribs.lang ? $(elem).children().last()[0].attribs.lang : 'reverse'
			}
		}

		const srcs = $('.src.ltr').length > 0 ? $('.src.ltr').map(clean) : $('.arabic').map(clean)
		const trgs = $('.trg.ltr').length > 0 ? $('.trg.ltr').map(clean) : $('.trg.rtl').length > 0 ? $('.trg.rtl').map(clean) : $('.arabic').map(clean)
		return {srcs, trgs}
	} catch (error) {
		return []
	}
}

module.exports.fetching = async input => {
	try {
		let employeesRes
		if (lngDetector.detect(input).length > 0 && lngDetector.detect(input)[0][0] === trgContext) {
			employeesRes = await getPairs(trgContext, srcContext, input)
		} else {
			employeesRes = await getPairs(srcContext, trgContext, input)
		}

		const itemsArr = []
		if (employeesRes.srcs.length > 0) {
			const employees = []
			for (let i = 0; i < employeesRes.srcs.length; i++) {
				employees[i] = [employeesRes.srcs[i], employeesRes.trgs[i]]
			}
			const replaceEM = target => target.replaceAll('<em>', ' (').replaceAll('</em>', ') ')
			for (const x of employees) {
				const largetype = `${replaceEM(x[0].src)}\n\n ↳ ${replaceEM(x[1].trg)}`
				const backInfo = [`${x[0].src}<br>    ↳ ${x[1].trg}`]
				const langDetect = x[0].lang !== srcRef || x[0].lang === 'reverse'
				const langBoolForReverse = langDetect && x[1].lang !== trgRef

				const item = new Render('list of search',
					'title', 'subtitle', 'text', 'arg', 'icon', 'valid', 'mods', 'variables')
				item.title = replaceEM(x[0].src)
				item.subtitle = replaceEM(x[1].trg)
				item.text = {
					copy: largetype,
					largetype
				}
				item.arg = {
					srcText: alfy.input,
					srcContext: [x[0].src],
					trgContext: [x[1].trg],
					toOddcast: [langBoolForReverse ? x[0].src : x[1].trg],
					currentSrc: langBoolForReverse ? srcContext : trgContext,
					backInfo
				}
				item.icon = './icon.png'
				item.valid = null
				item.mods = {ctrl: {arg: quickLook}}
				item.variables = {
					action: 'dic',
					mode: 'regular',
					validOutput: alfy.cache.get('validOutput') === 'true' ? 'true' : 'false',
					type: 'regular',
					currentSense: x.largeText
				}
				itemsArr.push(item.getProperties())
			}
		} else {
			itemsArr.push({
				title: 'API not exist examples',
				subtitle: 'Hint the Enter to go to context.reverso.net',
				text: {
					largetype: warning.notFound
				},
				arg: quickLook
			})
		}

		const items = itemsArr.filter(item => item.title)
		const variantsToSingleChoose = items.map(x => ({
			title: x.title,
			subtitle: x.subtitle,
			arg: JSON.stringify(x.arg, '', 2),
			icon: x.icon,
			text: x.text,
			variables: x.variables,
			autocomplete: x.autocomplete,
			mods: x.mods,
			quicklookurl: quickLook
		}))
		const variantsAll = alfy.matches('', items, 'title').map(x => ({
			arg: x.arg
		}))
		const variantsAllArgs = variantsAll.map(x => x.arg)
		alfy.config.set('allPhrases', variantsAllArgs)
		alfy.output(variantsToSingleChoose)
	} catch (error) {
		throw new WorkflowError(`${error}`, errorAction('main'))
	}
}

module.exports.quicklookurl = {
	quickLook
}
