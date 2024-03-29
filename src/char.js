const fs = require('fs');
const api = require('./api.js');
const fse = require('fs-extra');  
let pathtofile = null;
let setting;
let dir;
const saveDir = "Eve_Profile/";
Date.prototype.getUnixTime = function() { return this.getTime()/1000|0 };
if(!Date.now) Date.now = function() { return new Date(); }
Date.time = function() { return Date.now().getUnixTime(); }
/*ajouter gestion d'erreur front avec envoie de message quand tache fini + enlever les truc syncrone*/
module.exports =  {
	setting: (event, status) => {
		const regex2 = /[\w]{1,}(eve_sharedcache_tq_tranquility)/;
		let path = process.argv[2];
		if (process.platform !== 'darwin') {
			let path = process.env['USERPROFILE']+"/AppData/Local/CCP/EVE/"
			if (fs.existsSync(path)){
				fs.readdir(path, (err, files) => {
					files.forEach(file => {
						let m2 = regex2.exec(file)
						if(m2){
							// peut etre save le path dans un fichier pour la prochaine ouverture et donc fait une meilleur fonction ici si path pas tout refaire
							pathtofile = process.env['USERPROFILE']+"/AppData/Local/CCP/EVE/"+m2[0];
							
							dir = fs.readdirSync(pathtofile);
							event.sender.send('setting', dir); 
						}
					});
				})
			}
		} else {
			pathtofile = "/Users/"+process.env['USER']+"/Library/Application Support/EVE Online/p_drive/Local Settings/Application Data/CCP/EVE/SharedCache/wineenv/drive_c/users/"+process.env['USER']+"/Local Settings/Application Data/CCP/EVE/c_tq_tranquility/"
			dir = fs.readdirSync(pathtofile);
			event.sender.send('setting', dir);
		}
	},
	sendChar : (event, data) => {
		if(data)
			pathtofile += "/" + data
		const regex = /core_char_([0-9]+).dat$/;
		if (fs.existsSync(pathtofile)){
			fs.readdir(pathtofile, function(err, items) {
				for (let i=0; i<items.length; i++) {
					let m = regex.exec(items[i])
					if(m){
						api.info(m[1], event, items[i])
					}
				}
			});
		}
	},
	backup : (data) => {
		if (!fs.existsSync(pathtofile + "/" + saveDir)) {
			fs.mkdirSync(pathtofile + "/" + saveDir, 0777);
		}
		for (let o in data){
			fs.writeFileSync(pathtofile + "/" + saveDir + data[o] + ".backup_" +  new Date().getUnixTime(), fs.readFileSync(pathtofile + "/" +data[o]));
		}
	},
	valide : (data) => {
		if (!fs.existsSync(pathtofile + "/" + saveDir)) {
			fs.mkdirSync(pathtofile + "/" + saveDir, 0777);
		}
		for (let o in data.profiles){
			fs.writeFileSync(pathtofile + "/" + saveDir + data.profiles[o] + ".backup_" +  new Date().getUnixTime(), fs.readFileSync(pathtofile + "/" +data.profiles[o]));
			fs.createReadStream(pathtofile + "/" +data.main).pipe(fs.createWriteStream(pathtofile + "/" +data.profiles[o]))

		}
	},
	showRecup : (event) => {
		const regex = /core_char_([0-9]{0,}).dat.backup_([0-9]{0,})/;
		if (fs.existsSync(pathtofile + "/" + saveDir)) {
			fs.readdir(pathtofile + "/" + saveDir, function(err, items) {
				for (let i=0; i<items.length; i++) {
					let m = regex.exec(items[i]);
					api.infoRecup(event, m[1], m[2], m[0]);
				}
			})
		}
	},
	remove : (event, data) => {
		if (fs.existsSync(pathtofile + "/" + saveDir)) {
			fs.unlink(pathtofile + "/" + saveDir + data.file,function(err){
				if(err) return console.log(err);
				event.sender.send('removetrue', data.file);
			});  
		}
	},
	restore : (event, data) => {
		if (fs.existsSync(pathtofile + "/" + saveDir)) {
			fse.copy(pathtofile + "/" + saveDir + data.file, pathtofile + "//core_char_" + data.id + ".dat", (err) => {  
				if (err) throw err;  
				event.sender.send('restore');
			});  
		}
	}
}