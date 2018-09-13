const md5 = require('md5')

const {trgContext} = process.env

const language = variable => {
	switch (variable) {
		case 'arabic':
			return {
				lang: '27',
				name: ['Maged', 'Maged', 'Maged'],
				voiceID: ['1', '1', '1'],
				engineID: ['4', '4', '4']
			}
		case 'german':
			return {
				lang: '3',
				name: ['Anna', 'Steffi', 'Tim'],
				voiceID: ['3', '1', '2'],
				engineID: ['4', '4', '3']
			}
		case 'english':
			return {
				lang: '1',
				name: ['Julie', 'Kate', 'James'],
				voiceID: ['3', '1', '7'],
				engineID: ['3', '3', '3']
			}
		case 'spanish':
			return {
				lang: '2',
				name: ['Manuel (Castilian)', 'Paulina (Mexican)', 'Violeta'],
				voiceID: ['5', '4', '1'],
				engineID: ['3', '4', '3']
			}
		case 'french':
			return {
				lang: '4',
				name: ['Louis', 'Roxane', 'Thomas'],
				voiceID: ['4', '3', '5'],
				engineID: ['3', '3', '4']
			}
		case 'italian':
			return {
				lang: '7',
				name: ['Elisa', 'Paolo', 'Roberto'],
				voiceID: ['1', '1', '2'],
				engineID: ['3', '4', '3']
			}
		case 'japanese':
			return {
				lang: '12',
				name: ['Ryo', 'Show', 'Hikary'],
				voiceID: ['7', '2', '5'],
				engineID: ['3', '3', '3']
			}
		case 'dutch':
			return {
				lang: '11',
				name: ['Sakia', 'Ellen', 'Claire'],
				voiceID: ['2', '1', '2'],
				engineID: ['2', '4', '4']
			}
		case 'polish':
			return {
				lang: '14',
				name: ['Agata', 'Agata', 'Claire'],
				voiceID: ['1', '1', '2'],
				engineID: ['4', '4', '2']
			}
		case 'portuguese':
			return {
				lang: '6',
				name: ['Amalia (European)', 'Eusebio (European)', 'Helena (Brasilian)'],
				voiceID: ['2', '3', '1'],
				engineID: ['2', '2', '3']
			}
		case 'romanian':
			return {
				lang: '30',
				name: ['Simona', 'Simona', 'Ioana'],
				voiceID: ['1', '1', '1'],
				engineID: ['4', '4', '2']
			}
		case 'russian':
			return {
				lang: '21',
				name: ['Olga', 'Milena', 'Dmitri'],
				voiceID: ['1', '2', '2'],
				engineID: ['2', '4', '2']
			}

		default:
			break
	}
}

module.exports = example => {
	const voices = [
		{
			name: `${language(trgContext).name[0]}`,
			id: `<engineID>${language(trgContext).engineID[0]}</engineID><voiceID>${language(trgContext).voiceID[0]}</voiceID><langID>${language(trgContext).lang}</langID><ext>mp3</ext>`,
			url: `engine=${language(trgContext).engineID[0]}&language=${language(trgContext).lang}&voice=${language(trgContext).voiceID[0]}`
		},
		{
			name: `${language(trgContext).name[1]}`,
			id: `<engineID>${language(trgContext).engineID[1]}</engineID><voiceID>${language(trgContext).voiceID[1]}</voiceID><langID>${language(trgContext).lang}</langID><ext>mp3</ext>`,
			url: `engine=${language(trgContext).engineID[1]}&language=${language(trgContext).lang}&voice=${language(trgContext).voiceID[1]}`
		},
		{
			name: `${language(trgContext).name[2]}`,
			id: `<engineID>${language(trgContext).engineID[2]}</engineID><voiceID>${language(trgContext).voiceID[2]}</voiceID><langID>${language(trgContext).lang}</langID><ext>mp3</ext>`,
			url: `engine=${language(trgContext).engineID[2]}&language=${language(trgContext).lang}&voice=${language(trgContext).voiceID[2]}`
		}
	]
	const voiceRandom = voices[Math.floor(Math.random() * Math.floor(voices.length))]
	const id = md5(`${voiceRandom.id}${example}`)
	const options = {
		url: `http://cache-a.oddcast.com/c_fs/${id}.mp3?${voiceRandom.url}&text=${encodeURIComponent(example)}&useUTF8=1`,
		headers: {
			Referer: 'http://cache-a.oddcast.com/',
			'User-Agent': 'stagefright/1.2 (Linux;Android 5.0)'
		}
	}
	return {id, options}
}

module.exports.languagesShortName = [
	{arabic: 'ar'},
	{german: 'de'},
	{english: 'en'},
	{spanish: 'es'},
	{french: 'fr'},
	{hebrew: 'hr'},
	{italian: 'it'},
	{japanese: 'ja'},
	{dutch: 'nl'},
	{polish: 'pl'},
	{portuguese: 'pt'},
	{romanian: 'ro'},
	{russian: 'ru'}
]
