export class Service {
	async listPets(_req: any, reply: any) {
		return reply.send([{ id: 57865785, name: 'srvHello, listPets!' }]);
	}

	async createPets(req: any, reply: any) {
		const { body: { name } } = req;
		return reply.code(201).send({ id: 76585, name });
	}

	async showPetById(req: any, reply: any) {
		return reply.send({ id: req.params.petId, name: 'srvHello, showPetById!' });
	}
}
