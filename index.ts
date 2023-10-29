import fastify, { FastifySchema, HTTPMethods } from "fastify";
import { Service } from './service';
const path = require('path');
import SwaggerParser from '@apidevtools/swagger-parser';
const apiSpecPath = path.join(__dirname, 'petstore-openapi.v3.yaml'); // Replace with the path to your OpenAPI spec file

declare type Operation = {
	operationId: keyof Service;
	parameters: any[];
	requestBody: any;
	responses: any;
}

const getSchemaFromMethod = (operation: Operation): FastifySchema => {
	const { parameters, requestBody, responses } = operation;
	const allParameters = parameters.reduce((acc: Record<string, any>, param: any) => {
		if (param.in === 'path') {
			acc.params.properties[param.name] = param.schema;
		} else if (param.in === 'query') {
			acc.querystring.properties[param.name] = param.schema;
		} else if (param.in === 'header') {
			acc.headers.properties[param.name] = param.schema;
		}
		return acc;
	}, {
		querystring: {
			type: 'object',
			properties: {},
			required: [],
		},
		params: {
			type: 'object',
			properties: {},
			required: [],
		},
		headers: {
			type: 'object',
			properties: {},
			required: [],
		},
	});
	let body, response;
	if (requestBody) {
		const [ bodyContenttypeKey ] = Object.keys(requestBody['content']);
		body = requestBody['content'][bodyContenttypeKey]['schema'];
	}
	if (responses) {
		response = Object.keys(responses).reduce((acc: Record<string, any>, param: any) => {
			const [ key ] = Object.keys(responses[param]['content']);
			acc[param] = responses[param]['content'][key]['schema'];
			return acc;
		}, {});
	}
	return {
		...( body ? { body } : {} ),
		...( response ? { response } : {} ),
		...allParameters
	};
}

const main = async () => {
	try {
		const fastifyPathRegex = /{([\w-]*)}/g;
		const app = fastify({ logger: true });
		const service = new Service()
		const api = await SwaggerParser.validate(apiSpecPath);
		if (!api?.paths) {
			throw new Error('No Api!');
		}
		for (const [path, methods] of Object.entries(api.paths)) {
			for (const [ method, operation ] of Object.entries(methods) as [[ method: string, operation: Operation ]]) {
				const { operationId } = operation;
				const schema = getSchemaFromMethod(operation);
				if (operationId && service[operationId]) {
					app.route({
						method: method.toUpperCase() as HTTPMethods,
						url: path.replace(fastifyPathRegex, ':$1'),
						schema,
						handler: service[operationId],
					});
				}
			}
		}
		console.log("API name: %s, Version: %s", api.info.title, api.info.version);
		app.listen({ port: 3000 }, (err, address) => {
			if (err) {
			  console.error(err);
			  process.exit(1);
			}
			console.log(`Server is running on ${address}`);
		});
	  }
	  catch(err) {
		console.error(err);
	  }
};

main().catch(console.error);

