// emoji > çıkartma > rol permission > kanallardaki rol permission => discord.js prosu 
// TEMİZ BİR KOPYALAMA İÇİN ÖNCE KANALLAR VB. SİLİNECEK EĞER HERHEANGİ BİR ŞEYİN SİLİNMESİNİ İSTEMİOSAN :   29 dan 35'e  // 38 den 47 ye olan kod satırlarını silcen



const { Client, IntentsBitField, PermissionsBitField } = require('discord.js');
const client = new Client({
  intents: [IntentsBitField.Flags.Guilds, IntentsBitField.Flags.GuildMembers]
});
const botoken = 'token_gir'; 
const kopyasıAlıncakSunucu = 'kopyasıAlıncakSunucuID';
const kopyalancakSunucu = 'kopyalancakSunucuID';
const roleMap = new Map();
const channelMap = new Map();
client.once('ready', async () => {
  console.log(`${client.user.tag} olarak giriş yapıldı`);
  await kopyala();
  process.exit(0);
});
async function kopyala() {
  const kaynak = client.guilds.cache.get(kopyasıAlıncakSunucu);
  const hedef = client.guilds.cache.get(kopyalancakSunucu);

  if (!kaynak || !hedef) {
    console.error('sunucu bulunamadı?');
    return;
  }
  console.log(`"${kaynak.name}" sunucusu "${hedef.name}" sunucusuna kopyalanicak`);
  
  console.log('kopyalanma için kanallar silincek');
  for (const [id, channel] of hedef.channels.cache) {
    try {
      await channel.delete();
    } catch (err) { //Catch eklendı new ((hata bulmak için))
      console.error(`kaanal silinemedi ((err kodda hata olabilir)) ${channel.name}`);
    }
  }
  
  console.log('roller siliniyor');
  for (const [id, role] of hedef.roles.cache) {
    if (role.name !== '@everyone' && !role.managed) {
      try {
        await role.delete();
      } catch (err) {
        console.error(`rol silinemedi ${role.name}`);
      }
    }
  }

  console.log('roller kopyalanıyor');
  const roller = Array.from(kaynak.roles.cache.values())
    .filter(rol => rol.name !== '@everyone' && !rol.managed)
    .sort((a, b) => a.position - b.position);
  
  for (const rol of roller) {
    try {
      const yeniRol = await hedef.roles.create({
        name: rol.name,
        color: rol.color,
        hoist: rol.hoist,
        position: rol.position,
        permissions: rol.permissions,
        mentionable: rol.mentionable
      });
      roleMap.set(rol.id, yeniRol.id);
      console.log(` rol oluşturuldu ${rol.name}`);
    } catch (err) {
      console.error(` rol oluşturulamadı? : ${rol.name}`, err);
    }
  }
  try {
    const kaynakEveryone = kaynak.roles.everyone;
    const hedefEveryone = hedef.roles.everyone;
    await hedefEveryone.setPermissions(kaynakEveryone.permissions);
    console.log(' tüm (everyone) rol izinleri kopyalandı');
  } catch (err) {
    console.error(' tüm (everyone)  rol izinleri kopyalanamadı? :', err);
  }

  console.log('kategoriler kopyalanıyo');
  const kategoriler = kaynak.channels.cache.filter(c => c.type === 4);
  
  for (const [id, kategori] of kategoriler) {
    try {
      const izinler = [];
      kategori.permissionOverwrites.cache.forEach(perm => {
        const targetId = perm.type === 0 ? (roleMap.get(perm.id) || hedef.roles.everyone.id) : perm.id;
        izinler.push({
          id: targetId,
          type: perm.type,
          allow: perm.allow,
          deny: perm.deny
        });
      });

      const yeniKategori = await hedef.channels.create({
        name: kategori.name,
        type: kategori.type,
        position: kategori.position,
        permissionOverwrites: izinler
      });
      
      channelMap.set(kategori.id, yeniKategori.id);
      console.log(` kategori oluşturuldı ${kategori.name}`);
    } catch (err) {
      console.error(` kategori oluşturulamadı ${kategori.name}`, err);
    }
  }

  console.log('kanallar kopyalanıyor');
  const kanallar = kaynak.channels.cache.filter(c => c.type !== 4);
  
  for (const [id, kanal] of kanallar) {
    try {
      const izinler = [];
      kanal.permissionOverwrites.cache.forEach(perm => {
        const targetId = perm.type === 0 ? (roleMap.get(perm.id) || hedef.roles.everyone.id) : perm.id;
        izinler.push({
          id: targetId,
          type: perm.type,
          allow: perm.allow,
          deny: perm.deny
        });
      });

      const kanalAyarlari = {
        name: kanal.name,
        type: kanal.type,
        position: kanal.position,
        permissionOverwrites: izinler,
        parent: kanal.parent ? channelMap.get(kanal.parent.id) : null
      };

      if (kanal.type === 0) { 
        kanalAyarlari.topic = kanal.topic;
        kanalAyarlari.nsfw = kanal.nsfw;
        kanalAyarlari.rateLimitPerUser = kanal.rateLimitPerUser;
      } else if (kanal.type === 2) { 
        kanalAyarlari.bitrate = kanal.bitrate;
        kanalAyarlari.userLimit = kanal.userLimit;
        kanalAyarlari.rtcRegion = kanal.rtcRegion;
      } else if (kanal.type === 5) { 
        kanalAyarlari.topic = kanal.topic;
        kanalAyarlari.nsfw = kanal.nsfw;
      } else if (kanal.type === 13) { 
        kanalAyarlari.bitrate = kanal.bitrate;
        kanalAyarlari.rtcRegion = kanal.rtcRegion;
      } else if (kanal.type === 15) { 
        kanalAyarlari.topic = kanal.topic;
        kanalAyarlari.nsfw = kanal.nsfw;
        kanalAyarlari.rateLimitPerUser = kanal.rateLimitPerUser;
      }

      const yeniKanal = await hedef.channels.create(kanalAyarlari);
      channelMap.set(kanal.id, yeniKanal.id);
      console.log(` kanal oluşturuldu (: ${kanal.name}`);
    } catch (err) {
      console.error(` kanal oluşturulamadı?: ${kanal.name}`, err);
    }
  }

  console.log('Emojiler kopyalanıyor');
  for (const [id, emoji] of kaynak.emojis.cache) {
    try {
      await hedef.emojis.create({
        attachment: emoji.url,
        name: emoji.name
      });
      console.log(` emoji kopyalandı  ${emoji.name}`);
    } catch (err) {
      console.error(` emoji kopyalanamadı ${emoji.name}`);
    }
  }

  console.log('stickerlar kopyalanıyor');
  for (const [id, sticker] of kaynak.stickers.cache) {
    try {
      await hedef.stickers.create({
        file: sticker.url,
        name: sticker.name,
        tags: sticker.tags,
        description: sticker.description
      });
      console.log(` sticker kopyalandı: ${sticker.name}`);
    } catch (err) {
      console.error(` sticker kopyalanamadı: ${sticker.name}`);
    }
  }

  try {
    const sunucuAyarları = {
      verificationLevel: kaynak.verificationLevel,
      explicitContentFilter: kaynak.explicitContentFilter,
      defaultMessageNotifications: kaynak.defaultMessageNotifications
    };
    
    await hedef.setVerificationLevel(sunucuAyarları.verificationLevel);
    await hedef.setExplicitContentFilter(sunucuAyarları.explicitContentFilter);
    await hedef.setDefaultMessageNotifications(sunucuAyarları.defaultMessageNotifications);
    
    if (kaynak.icon) {
      await hedef.setIcon(kaynak.iconURL({ dynamic: true, size: 4096 }));
    }
    
    if (kaynak.banner) {
      await hedef.setBanner(kaynak.bannerURL({ size: 4096 }));
    }
    
    console.log('tamamlandı');
  } catch (err) {  //Catch eklendı new
    console.error('hata? :', err);
  }

  console.log('bu sefer tamamlandı');
}

client.login(botoken).catch(error => {   //Catch eklendı new
  console.error('giriş yapılamadı? :', error);
});