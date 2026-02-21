/**	Create a consumable scroll item for a power and give that
 *	power the arcane property so that it's its own entry in the
 *	powers list and doesn't use general power points.
 */

async function makeScroll(item) {
	if (item.getFlag('swade-make-magic', 'isScroll')) {
		ui.notifications.notify(`${item.name} is already a scroll.`);
		return;
	}
	let actor = item.parent;
	let skillName = 'Smarts';
	let skill = actor.items.find(it => {
		switch (it.name) {
		case 'Gifted':
		case 'Miracles':
		case 'Spellcasting':
		case 'Psionics':
		case 'Weird Science':
			return true;
		}
	});
	if (skill)
		skillName = skill.name;

	const scrollName = `${item.name} Scroll`;

	await item.update({
		"system.arcane": scrollName,
		"system.actions.trait": skillName
	});
	let pp = item.system.pp;
	let cost = 0;
	switch (item.system.rank) {
	case 'Novice':
		cost = pp * 50;
		break;
	case 'Seasoned':
		cost = pp * 2 * 50;
		break;
	case 'Veteran':
		cost = pp * 3 * 50;
		break;
	case 'Heroic':
		cost = pp * 4 * 50;
		break;
	case 'Legendary':
		cost = pp * 5 * 50;
		break;
	}
	
	// Define the scroll
	const powerUUID = `Actor.${actor._id}.Item.${item._id}`;
	const itemData = {
	  name: scrollName,
	  type: "consumable",
	  system: {
		description: `<p>The @UUID[${powerUUID}]{${item.name}} power is linked to this scroll.</p>`,

		// Quantity tracking
		quantity: 1,

		// Uses / charges
		uses: {
		  value: 1,
		  max: 1,
		  per: "charges", // SWADE uses charges
		},
		grantOn: 1,

		// Optional price
		price: cost,

		// Weight (in pounds)
		weight: 0,

		// Consumable-specific behavior
		consumeOnUse: true
	  },
	  flags: {
		swade: {
			hasGranted: [
				item.id
			]
		}
	  }
	};
	
	let powerPoints = actor.system.powerPoints;
	powerPoints[scrollName] = {max: item.system.pp, value: item.system.pp};
	await actor.update({
		"system.powerPoints": powerPoints,
		"system.grantOn": 1
	});
	
	// Create the item on the actor
	let newItem = await actor.createEmbeddedDocuments("Item", [itemData]);
	await item.update({
		"name": `${item.name} Scroll`
	});

	await item.setFlag('swade-make-magic', 'isScroll', true);
}


Hooks.on("ready", () => {
	console.log("swade-make-scroll ready");
});


function magicArmor(item) {
	console.log("Magic armor");

	const isMagic = item.getFlag('swade-make-magic', 'isMagic');
	if (isMagic) {
		ui.notifications.notify(`${item.name} is already magic.`);
		return;
	}
	
	const plus1cost = game.settings.get('swade-make-magic', 'plus1armor');
	const plus2cost = game.settings.get('swade-make-magic', 'plus2armor');
	const plus2costLight = game.settings.get('swade-make-magic', 'plus2armorLight');

	new foundry.applications.api.DialogV2({
		window: {
			title: "Make Armor Magic",
			position: {
				width: 400
			}
		},
		content: `<div class="form-group">
			<div class="flexcol">
				<label><input type="radio" name="choice" value="plus1" checked> +1 Armor (${plus1cost})</label>
				<label><input type="radio" name="choice" value="plus2"> +2 Armor (${plus2cost})</label>
				<label><input type="radio" name="choice" value="plus2light"> +2 Armor, lower Min. Str (${plus2costLight})</label>
			</div>
		</div>
		`,
		buttons: [
			{
				action: "ok",
				label: "OK",
				default: true,
				callback: (event, button, dialog) => button.form.elements.choice.value
			},
			{
				action: "cancel",
				label: "Cancel",
				callback: (event, button, dialog) => "cancel"
			}
		],
		submit: result => {
			switch (result) {
			case 'plus1':
				item.update(
					{
						"name": `${item.name} +1`,
						"system.armor": item.system.armor + 1,
						"system.price": item.system.price + plus1cost
					}
				);
				break;
			case 'plus2':
				item.update(
					{
						"name": `${item.name} +2`,
						"system.armor": item.system.armor + 2,
						"system.price": item.system.price + plus2cost
					}
				);
				break;
			case 'plus2light':
				let minStr = parseInt(item.system.minStr.replace(/^d/i, ""));
				minStr -= 2;
				if (minStr < 4)
					minStr = 4;
				item.update(
					{
						"name": `${item.name} +2 (Light)`,
						"system.armor": item.system.armor + 2,
						"system.price": item.system.price + plus2costLight,
						"system.minStr": `d${minStr}`
					}
				);
				break;
			default:
				return;
			}
			item.setFlag('swade-make-magic', 'isMagic', true);
		}
	}).render({ force: true });	
}


function magicShield(item) {
	console.log("Magic shield");

	const isMagic = item.getFlag('swade-make-magic', 'isMagic');
	if (isMagic) {
		ui.notifications.notify(`${item.name} is already magic.`);
		return;
	}

	const plus1cost = game.settings.get('swade-make-magic', 'plus1shield');
	const plus1costLight = game.settings.get('swade-make-magic', 'plus1shieldLight');

	new foundry.applications.api.DialogV2({
		window: {
			title: "Make Shield Magic",
			position: {
				width: 400
			}
		},
		content: `<div class="form-group">
			<div class="flexcol">
				<label><input type="radio" name="choice" value="plus1" checked> +1 Parry (${plus1cost})</label>
				<label><input type="radio" name="choice" value="plus1light"> +1 Parry, lower Min. Str (${plus1costLight})</label>
			</div>
		</div>
		`,
		buttons: [
			{
				action: "ok",
				label: "OK",
				default: true,
				callback: (event, button, dialog) => button.form.elements.choice.value
			},
			{
				action: "cancel",
				label: "Cancel",
				callback: (event, button, dialog) => "cancel"
			}
		],
		submit: result => {
			switch (result) {
			case 'plus1':
				item.update(
					{
						"name": `${item.name} +1`,
						"system.parry": item.system.parry + 1,
						"system.price": item.system.price + plus1cost
					}
				);
				break;
			case 'plus1light':
				let minStr = parseInt(item.system.minStr.replace(/^d/i, ""));
				minStr -= 2;
				if (minStr < 4)
					minStr = 4;
				item.update(
					{
						"name": `${item.name} +1 (Light)`,
						"system.parry": item.system.parry + 1,
						"system.price": item.system.price + plus1costLight,
						"system.minStr": `d${minStr}`
					}
				);
				break;
			default:
				return;
			}
			item.setFlag('swade-make-magic', 'isMagic', true);
		}
	}).render({ force: true });	
}

function magicWeapon(item) {
	console.log("Magic weapon");

	const isMagic = item.getFlag('swade-make-magic', 'isMagic');
	if (isMagic) {
		ui.notifications.notify(`${item.name} is already magic.`);
		return;
	}
	
	const plus1cost = game.settings.get('swade-make-magic', 'plus1weapon');
	const plus2cost = game.settings.get('swade-make-magic', 'plus2weapon');
	const plus2damageCost = game.settings.get('swade-make-magic', 'plus2weaponDamage');

	new foundry.applications.api.DialogV2({
		window: {
			title: "Make Weapon Magic",
			position: {
				width: 400
			}
		},
		content: `<div class="form-group">
			<div class="flexcol">
				<label><input type="radio" name="choice" value="plus1" checked> +1 Trait (${plus1cost})</label>
				<label><input type="radio" name="choice" value="plus2"> +2 Trait (${plus2cost})</label>
				<label><input type="radio" name="choice" value="plus2dmg"> +2 Trait, damage increase (${plus2damageCost})</label>
			</div>
		</div>
		`,
		buttons: [
			{
				action: "ok",
				label: "OK",
				default: true,
				callback: (event, button, dialog) => button.form.elements.choice.value
			},
			{
				action: "cancel",
				label: "Cancel",
				callback: (event, button, dialog) => "cancel"
			}
		],
		submit: result => {
			switch (result) {
			case 'plus1':
				item.update(
					{
						"name": `${item.name} +1`,
						"system.actions.traitMod": item.system.actions.traitMod + 1,
						"system.price": item.system.price + plus1cost
					}
				);
				break;
			case 'plus2':
				item.update(
					{
						"name": `${item.name} +2`,
						"system.actions.traitMod": item.system.actions.traitMod + 2,
						"system.price": item.system.price + plus2cost
					}
				);
				break;
			case 'plus2dmg':
				let dmg = item.system.damage.replaceAll(/d[0-9]+/g, function (x) {
					const dieType = parseInt(x.replace('d', ''));
					if (dieType == 12)
						return "d12+1";
					return 'd' + (dieType + 2);
				});
				item.update(
					{
						"name": `${item.name} +2 (${dmg.replace('@str', 'Str')})`,
						"system.actions.traitMod": item.system.actions.traitMod + 2,
						"system.price": item.system.price + plus2damageCost,
						"system.damage": dmg
					}
				);
				break;
			default:
				return;
			}
			item.setFlag('swade-make-magic', 'isMagic', true);
		}
	}).render({ force: true });	
}

function listSkillNames() {
	let skillNames = [];
	for (const pack of game.packs) {
		if (pack.metadata.type == 'Item') {
			for (const it of pack.index) {
				if (it.type == 'skill') {
					if (!skillNames.includes(it.name))
						skillNames.push(it.name);
				}
			}
		}
	}
	skillNames.sort();
	return skillNames;
}

async function magicJewelry(item) {
	console.log("Magic jewelry");

	const isMagic = item.getFlag('swade-make-magic', 'isMagic');
	if (isMagic) {
		ui.notifications.notify(`${item.name} is already magic.`);
		return;
	}

	const attributeCost = game.settings.get('swade-make-magic', 'attribute');
	const skillCost = game.settings.get('swade-make-magic', 'skill');

	let attributes = ['Agility', 'Smarts', 'Spirit', 'Strength', 'Vigor'];
	let skillNames = listSkillNames();

	let traitOptions = `<option value="none">--Select--</option>\n`;
	for (const t of attributes)
		traitOptions += `<option value="${t}">${t}</option>\n`;
	for (const s of skillNames)
		traitOptions += `<option value="${s}">${s}</option>\n`;
	
	let trait = "";
	
	new foundry.applications.api.DialogV2({
		window: {
			title: "Make Weapon Magic",
			position: {
				width: 400
			}
		},
		content: `<div class="form-group">
			<div class="flexcol">
				<label><input type="radio" name="type" value="Bracelet" checked>Bracelet</label>
				<label><input type="radio" name="type" value="Brooch">Brooch</label>
				<label><input type="radio" name="type" value="Earring">Earring</label>
				<label><input type="radio" name="type" value="Hairpin">Hairpin</label>
				<label><input type="radio" name="type" value="Necklace">Necklace</label>
				<label><input type="radio" name="type" value="Ring">Ring</label>
			</div>
			<div>
				<label for="trait">Trait</label>
					<select name="trait" id="trait">
						${traitOptions}
					</select>
			</div>
		</div>
		`,
		buttons: [
			{
				action: "ok",
				label: "OK",
				default: true,
				callback: (event, button, dialog) => {
					trait = button.form.elements.trait.value;
					return button.form.elements.type.value;
				}
			},
			{
				action: "cancel",
				label: "Cancel",
				callback: (event, button, dialog) => "cancel"
			}
		],
		submit:  async (result) => {
			const isAttribute = attributes.includes(trait);
			const price = isAttribute ? attributeCost : skillCost;
			let effects = item.effects;

			let attributeKey;
			if (isAttribute) {
				attributeKey = `system.attributes.${trait.toLowerCase()}.die.sides`;
			} else {
				attributeKey = `@Skill{${trait}}[system.die.sides]`;
			}

			const effectData = {
			  name: `${trait} Increase`,
			  icon: item.img,
			  origin: item.uuid,
			  disabled: false,
			  transfer: true, // important: transfers to actor when equipped
			  duration: {
				seconds: null
			  },
			  changes: [
				{
				  key: attributeKey,
				  mode: CONST.ACTIVE_EFFECT_MODES.ADD,
				  value: 2,
				  priority: 20
				}
			  ],
			  flags: {
				swade: {
				  favorite: true
				}
			  }
			};
			await item.createEmbeddedDocuments("ActiveEffect", [effectData]);

			item.update(
				{
					"name": `${result} of ${trait}`,
					"system.price": price,
					"system.description": `<p>This piece of magic jewelry increases ${trait} by one die step.</p>`
				}
			);
			item.setFlag('swade-make-magic', 'isMagic', true);
		}
	}).render({ force: true });	
}

Hooks.on("getItemSheetHeaderButtons", (sheet, buttonArray) => {
	switch (sheet.object.parent?.type) {
	case 'npc': case 'character':
		break;
	default:
		return;
	}

	switch (sheet.object.type) {
	case 'armor':
	case 'weapon':
	case 'shield':
	case 'power':
		// Don't allow a magic item to be magicked again.
		if (sheet.object.getFlag('swade-make-magic', 'isMagic'))
			return;
		break;
	case 'gear':
		if (sheet.object.getFlag('swade-make-magic', 'isMagic'))
			return;
		if (sheet.object.system.swid !== 'magic-jewelry')
			return;
		break;
	default:
		return;
	}

	switch (sheet.object.parent.type) {
	case 'npc': case 'character':
		let button = {
			label: "Make Magic",
			class: 'make-magic',
			icon: 'fas fa-scroll',
			onclick: () => {
				switch (sheet.object.type) {
				case 'power':
					makeScroll(sheet.object);
					break;
				case 'armor':
					magicArmor(sheet.object);
					break;
				case 'weapon':
					magicWeapon(sheet.object);
					break;
				case 'shield':
					magicShield(sheet.object);
					break;
				case 'gear':
					if (sheet.object.system.swid === 'magic-jewelry')
						magicJewelry(sheet.object);
					break;
				}
			}
		}
		buttonArray.unshift(button);
		break;
	}
});



class MakeScrollDialog extends foundry.applications.api.DialogV2 {
	
	scroll = null;

	constructor(scroll, options) {
		super(options);
		this.scroll = scroll;

		// Create a DragDrop controller
		this._dragDrop = new foundry.applications.ux.DragDrop({
		  dropSelector: "item-drop-zone",
		  permissions: { drop: () => true },
		  callbacks: {
			drop: this._onDrop.bind(this)
		  }
		});
	}

	async _onDrop(event) {
		event.preventDefault();

		const data = TextEditor.getDragEventData(event);
		if (!data) return;

		if (data.type === "Item") {
		  const item = await Item.fromDropData(data);
		  ui.notifications.info(`Dropped item: ${item.name}`);

		  // Example: update dialog content
		  const el = this.element.querySelector(".dropped-item");
		  el.textContent = item.name;
		}
	}

	async _onRender(context, options) {
	}

	activateListeners(html) {
		super.activateListeners(html);
		this._dragDrop.bind(html[0]);
		return;

		dropZone.addEventListener("drop", async event => {
		  event.preventDefault();

		  let data;
		  try {
			data = JSON.parse(event.dataTransfer.getData("text/plain"));
		  } catch (err) {
			ui.notifications.warn("Invalid drop data.");
			return;
		  }

		  // Ensure it's an Item
		  if (data.type !== "Item") {
			ui.notifications.warn("Please drop an Item.");
			return;
		  }

		  // Resolve the Item document
		  const item = await fromUuid(data.uuid);
		  if (!item) {
			ui.notifications.error("Could not resolve Item.");
			return;
		  }

		  // Display feedback
		  result.innerHTML = `
			<strong>Dropped Item:</strong><br>
			${item.name}<br>
			<em>Type:</em> ${item.type}
		  `;

		  console.log("Dropped item:", item);
		});
	}

	close() {
		super.close();
	}
}


Hooks.on("createItem", async (item, action, id) => {
	if (!item.parent)
		return;
	if (item.system.isArcaneDevice) {
		if (item.system.powerPoints.max <= 0)
			return;
		let arcane = null;
		for (let g of item.system.grants) {
			if (g?.mutation?.system?.arcane) {
				arcane = g.mutation.system.arcane;
				break;
			}
		}
		if (!arcane)
			return;
		let actorPP = item.parent.system?.powerPoints;
		if (!actorPP)
			return;
		actorPP[arcane] = {
			max: item.system.powerPoints.max,
			value: item.system.powerPoints.max
		};
		await item.parent.update({"system.powerPoints": actorPP});
		return;
	}

	if (item.type !== 'consumable')
		return;
	if (item.system.swid !== 'scroll')
		return;
	let actor = item.parent;
	if (actor.type !== 'character' && actor.type != 'npc')
		return;

	let content = `
        <div class="item-drop-zone" id="item-drop-zone"
             style="
               border: 2px dashed #999;
               border-radius: 8px;
               padding: 2em;
               text-align: center;
               font-size: 1.1em;
               color: #666;
             ">
          Drag & Drop the Scroll Power Here
		 </div>
		 <div class="item-result" style="margin-top: 1em;"></div>`;

	let dlg = new MakeScrollDialog(item, {
	  window: {
		  title: `Add Scroll to ${actor.name}`,
		  resizable: true,
		  position: {
			  width: 400
		  }
	  },
	  content: content,
	  buttons: [
		{
			action: "ok",
			label: "OK",
			callback: () => { 
			}
		},
		{
			action: "cancel",
			label: "Cancel"
		}
	  ]
	});
	
	dlg.render(true);
});


Hooks.once('init', async function () {
	game.settings.register('swade-make-magic', 'plus1armor', {
	  name: '+1 Armor',
	  hint: 'Cost of +1 Armor magic bonus.',
	  scope: 'world',     // "world" = sync to db, "client" = local storage
	  config: true,       // false if you dont want it to show in module config
	  type: Number,       // Number, Boolean, String, Object
	  default: 3000
	});
	game.settings.register('swade-make-magic', 'plus2armor', {
	  name: '+2 Armor',
	  hint: 'Cost of +2 Armor magic bonus.',
	  scope: 'world',     // "world" = sync to db, "client" = local storage
	  config: true,       // false if you dont want it to show in module config
	  type: Number,       // Number, Boolean, String, Object
	  default: 6000
	});
	game.settings.register('swade-make-magic', 'plus2armorLight', {
	  name: '+2 Armor (light)',
	  hint: 'Cost of +2 Armor magic bonus, reduced Min. Strength.',
	  scope: 'world',     // "world" = sync to db, "client" = local storage
	  config: true,       // false if you dont want it to show in module config
	  type: Number,       // Number, Boolean, String, Object
	  default: 8000
	});
	game.settings.register('swade-make-magic', 'plus1shield', {
	  name: '+1 Shield',
	  hint: 'Cost of +1 Shield magic parry bonus.',
	  scope: 'world',     // "world" = sync to db, "client" = local storage
	  config: true,       // false if you dont want it to show in module config
	  type: Number,       // Number, Boolean, String, Object
	  default: 3000
	});
	game.settings.register('swade-make-magic', 'plus1shieldLight', {
	  name: '+1 Shield (light)',
	  hint: 'Cost of +1 Shield magic parry bonus, reduced Min. Strength.',
	  scope: 'world',     // "world" = sync to db, "client" = local storage
	  config: true,       // false if you dont want it to show in module config
	  type: Number,       // Number, Boolean, String, Object
	  default: 6000
	});
	game.settings.register('swade-make-magic', 'plus1weapon', {
	  name: '+1 Weapon',
	  hint: 'Cost of +1 magic weapon trait bonus.',
	  scope: 'world',     // "world" = sync to db, "client" = local storage
	  config: true,       // false if you dont want it to show in module config
	  type: Number,       // Number, Boolean, String, Object
	  default: 4000
	});
	game.settings.register('swade-make-magic', 'plus2weapon', {
	  name: '+2 Weapon',
	  hint: 'Cost of +2 magic weapon trait bonus.',
	  scope: 'world',     // "world" = sync to db, "client" = local storage
	  config: true,       // false if you dont want it to show in module config
	  type: Number,       // Number, Boolean, String, Object
	  default: 8000
	});
	game.settings.register('swade-make-magic', 'plus2weaponDamage', {
	  name: '+2 Weapon +Damage',
	  hint: 'Cost of +2 magic weapon bonus, increased damage.',
	  scope: 'world',     // "world" = sync to db, "client" = local storage
	  config: true,       // false if you dont want it to show in module config
	  type: Number,       // Number, Boolean, String, Object
	  default: 10000
	});
	game.settings.register('swade-make-magic', 'attribute', {
	  name: 'Increased Attribute',
	  hint: 'Cost of magic attribute increase.',
	  scope: 'world',     // "world" = sync to db, "client" = local storage
	  config: true,       // false if you dont want it to show in module config
	  type: Number,       // Number, Boolean, String, Object
	  default: 16000
	});
	game.settings.register('swade-make-magic', 'skill', {
	  name: 'Increased Skill',
	  hint: 'Cost of magic skill increase.',
	  scope: 'world',     // "world" = sync to db, "client" = local storage
	  config: true,       // false if you dont want it to show in module config
	  type: Number,       // Number, Boolean, String, Object
	  default: 10000
	});
});