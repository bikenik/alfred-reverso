/* eslint quotes: ["error", "single", { "allowTemplateLiterals": true }] */
/* eslint no-trailing-spaces: ["error", { "skipBlankLines": true }] */
'use strict'

let largetype
const clearSentences = argSentence => argSentence.replace(/\s(\.|\?|!)/g, `$1`)
const largetypeFunc = (sentence, arg, title, subtitle) => {
	if (sentence && arg) {
		sentence = Array.isArray(sentence) ? sentence.map(x => clearSentences(x.text)) : clearSentences(sentence)
		largetype = `${title}${arg.sense && arg.sense.register_label ? ` ⇒ [${arg.sense.register_label}]` : ''}\n\n🔑 :${subtitle}${Array.isArray(sentence) ? `\n\n🎯 ${sentence.map(x => x).join('\n🎯 ')}` : /🎲/.test(sentence) ? sentence : `\n\n🎯 ${sentence}`}`
	}
}
const clearSentencesInArg = arg => {
	if (arg && arg.examples) {
		for (const example of arg.examples) {
			if (example.text) {
				example.text = clearSentences(example.text)
			}
		}
	}
}

module.exports = class Render extends Array {
	constructor(name, ...items) {
		super(...items)
		const hasProp = key => {
			if (items.length > 0) {
				return items
					.filter(x => Object.prototype.hasOwnProperty
						.call(x, key))[0] ?
					items.filter(x => Object.prototype.hasOwnProperty.call(x, key))[0][key] : undefined
			}
		}
		this.name = name
		this.items = []
		this.title = hasProp('title')
		this.subtitle = hasProp('subtitle')
		this.sentence = hasProp('sentence')
		this.icon = hasProp('icon')
		this.arg = hasProp('arg')
		this.icon = {
			path: this.icon
		}
		this.autocomplete = this.title ? this.title.replace(/\n.*/g, '') : ''
		this.valid = hasProp('valid') ? hasProp('valid') : true
		this.mods = hasProp('mods') ? hasProp('mods') : {
			ctrl: {
				valid: false
			}
		}
		this.variables = hasProp('variables')
		largetypeFunc(this.sentence, this.arg, this.title, this.subtitle)
		clearSentencesInArg(this.arg)
		this.text = hasProp('text') ? hasProp('text') : {
			copy: largetype,
			largetype
		}
	}

	add(item) {
		this.items.push(item)
	}
}

module.exports.warning = {
	notFound: `\n\n🎯 does not offer examples\n\n🎲 API not exist examples, maybe your pair of languages not supporting.\nHint the Enter to go to context.reverso.net`,
	notFoundCouse: `Current page of API should include the Audio with an example but it doesn't contain them.  Maybe a path to file is damaged.`
}
