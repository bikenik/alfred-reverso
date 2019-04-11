/* eslint quotes: ["error", "single", { "allowTemplateLiterals": true }] */
/* eslint no-trailing-spaces: ["error", { "skipBlankLines": true }] */
'use strict'

const clearSentences = argSentence => argSentence.replace(/\s(\.|\?|!)/g, `$1`)
const largetypeFunc = (sentence, arg, title, subtitle) => {
	if (sentence && arg) {
		sentence = Array.isArray(sentence) ? sentence.map(x => clearSentences(x.text)) : clearSentences(sentence)
		return `${title}${arg.sense && arg.sense.register_label ? ` ⇒ [${arg.sense.register_label}]` : ''}\n\n🔑 :${subtitle}${Array.isArray(sentence) ? `\n\n🎯 ${sentence.map(x => x).join('\n🎯 ')}` : /🎲/.test(sentence) ? sentence : `\n\n🎯 ${sentence}`}`
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

module.exports = class Render {
	constructor(name, ...itemKeys) {
		const item = {}
		item.name = name
		item.valid = true
		item.sentence = ''
		item.mods = {
			ctrl: {
				valid: false
			}
		}
		for (const key of itemKeys) {
			this.itemKey = null
			Object.defineProperty(this, key, {
				get: () => key,
				set: value => {
					item[key] = value
					if (key === 'title') {
						item.autocomplete = item.title
					}

					if (Object.keys(item).length - 3 === itemKeys.length) {
						clearSentencesInArg(item.arg)
						if (!item.text) {
							const largetype = largetypeFunc(item.sentence, item.arg, item.title, item.subtitle)
							item.text = {
								copy: largetype,
								largetype
							}
						}
					}
				}
			})
		}

		this.getProperties = () => item
	}
}

module.exports.warning = {
	notFound: `\n\n🎯 does not offer examples\n\n🎲 API not exist examples, maybe your pair of languages not supporting.\nHint the Enter to go to context.reverso.net`,
	notFoundCouse: `Current page of API should include the Audio with an example but it doesn't contain them.  Maybe a path to file is damaged.`
}
