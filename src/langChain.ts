// import { ChatOpenAI } from '@langchain/openai';
// import { pull } from 'langchain/hub';
// import type { ChatPromptTemplate } from '@langchain/core/prompts';
// import { DoMoreThingsPluginSetting } from 'src/DoMoreThingsSettings';

// export type LangChainAgentResponse = {
// 	id: string;
// 	_reason: string;
// 	_upNext: { id: string };
// };

// export class LangChainAgentService {
// 	private _model: ChatOpenAI;

// 	constructor(readonly _settings: DoMoreThingsPluginSetting) {
// 		process.env.LANGCHAIN_API_KEY = _settings.langChainApiKey;
// 		process.env.LANGCHAIN_ENDPOINT = _settings.langChainEndpoint;
// 		process.env.LANGCHAIN_TRACING_V2 = 'true';
// 		process.env.LANGCHAIN_PROJECT = _settings.langChainProject;

// 		this._model = new ChatOpenAI({
// 			temperature: 0,
// 			maxTokens: _settings.chatGptMaxTokens,
// 			modelName: _settings.chatGptModel,
// 			openAIApiKey: _settings.chatGptApiKey,
// 		});
// 	}

// 	getNextTodo = async (input: string): Promise<LangChainAgentResponse> => {
// 		try {
// 			const prompt = await pull<ChatPromptTemplate>('do-more-things');

// 			const messages = await prompt.formatMessages({ json: input }); // if your prompt expects a variable named `input`

// 			const response = await this._model.invoke([
// 				...messages,
// 				{
// 					role: 'user',
// 					content: 'What should I do next?',
// 				},
// 			]);

// 			const result = response.text
// 				.replace('```json', '')
// 				.replace('```', '');

// 			return JSON.parse(result);
// 		} catch (error) {
// 			console.error('Error:', error);
// 			throw error;
// 		}
// 	};

// 	addTodoContent = async (input: string): Promise<string> => {
// 		try {
// 			const prompt = await pull<ChatPromptTemplate>('create-new-todo');

// 			const messages = await prompt.formatMessages({
// 				content: input,
// 			});

// 			const response = await this._model.invoke([...messages]);

// 			const result = response.text;

// 			return result;
// 		} catch (error) {
// 			console.error('Error:', error);
// 			throw error;
// 		}
// 	};
// }
