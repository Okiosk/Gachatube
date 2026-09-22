/**
 * Channel Avatars provider for GachaTube cards
 * Maps channel names to official YouTube avatar URLs (yt3.googleusercontent.com)
 */

const AVATAR_MAP = {
  'Squeezie': 'https://yt3.googleusercontent.com/ytc/AIdro_mPZvx-xk6pbAYdC7G8jUZzgCNDDTg1ZfF0_Lwd8UpJT4M=s176-c-k-c0x00ffffff-no-rj',
  'Tibo InShape': 'https://yt3.googleusercontent.com/MXKYsX4ryzhIwTLMwBUvx6eoWMcaF-gsHO_PLidZMEKyFj-eKyg9u0IykU8uh7ejCAS9omOlyP8=s176-c-k-c0x00ffffff-no-rj',
  'Cyprien': 'https://yt3.googleusercontent.com/ytc/AIdro_kKiE1Vpd2RZMv057AzKdHBtqkL7ksZhZ4Huwfbr9ngUyU=s176-c-k-c0x00ffffff-no-rj',
  'Norman': 'https://yt3.googleusercontent.com/6DAgneBRFbtYqCZRBcw26JpmyKT4CNcU36GZ-OGwOvVbNBkTewuBxmZSnot22FPQecPDxf1LZbc=s176-c-k-c0x00ffffff-no-rj',
  'Michou': 'https://yt3.googleusercontent.com/AbT6_C0E4bzscwpKqfdeMg6wTCuo_5pP9lkeqcLBFtqbgJsf8GaRGBAUnf7ZuNwEuiTHA7fI=s176-c-k-c0x00ffffff-no-rj',
  'Inoxtag': 'https://yt3.googleusercontent.com/ytc/AIdro_nBv_ScBglsYmGLCeX8gG5E7_rC-p9M0I4hQAcEMaHjJa4=s176-c-k-c0x00ffffff-no-rj',
  'Amixem': 'https://yt3.googleusercontent.com/mkxR4YNTUBJAjuq020488wM8yHSCZ4Kwn0etJyYyGTL86LnEiIzu5uhw8EwmPpRxavKYXyQ4Hmk=s176-c-k-c0x00ffffff-no-rj',
  'Joyca': 'https://yt3.googleusercontent.com/F5R-8dCR4OsDu1Rs_2RE20e6LUNFDJW6VemSqToit8XvdfoSj1DXJXb0Dc4aT_YEv-5TsFCF=s176-c-k-c0x00ffffff-no-rj',
  'Mcfly et Carlito': 'https://yt3.googleusercontent.com/ytc/AIdro_kSPG3h89eFoHhkLFYl_VQ6OkFpLCfpZUSuIWkRJt0sI-E=s176-c-k-c0x00ffffff-no-rj',
  'Mister V': 'https://yt3.googleusercontent.com/9waBvH5yP5jTNSGZ-n9Na5ldf3vnzmFOEjv6PUEuCiaRkfffk50GpF6nkDleoapVrR22Uupm8Lc=s176-c-k-c0x00ffffff-no-rj',
  'HugoDécrypte': 'https://yt3.googleusercontent.com/doPajjcwkXA71S2WCZsvhXSGapCsp46InwN9048iQa327OXZwxXvXJCY3FnGL6BpymL4k9jATA=s176-c-k-c0x00ffffff-no-rj',
  'Mastu': 'https://yt3.googleusercontent.com/ytc/AIdro_kcL_PnNz1KEjLIQ7veCTq_0Vv7tktG0oth4M0_NZp8PRw=s176-c-k-c0x00ffffff-no-rj',
  'Seb la Frite': 'https://yt3.googleusercontent.com/rvhrWfq5r2kSDFm8FWblEvHEaC-sMHFkcO2cci0Dmkp3TIAMXbGXp97nW27orkfv0Qd5auCC1A=s176-c-k-c0x00ffffff-no-rj',
  'Joueur Du Grenier': 'https://yt3.googleusercontent.com/ytc/AIdro_l5M7wAHM9QledrlSHNomrm8tV-pTAyzUiFtL7iSVFUIA=s176-c-k-c0x00ffffff-no-rj',
  'Pierre Croce': 'https://yt3.googleusercontent.com/nITpEppzrNhVmiOCzBsmwQdjzaJ-qJnz4KKwqhbfXgTxdAkKP8ITAz3dlmdIOLPnm4nyxBdbOA=s176-c-k-c0x00ffffff-no-rj',
  'Wankil Studio': 'https://yt3.googleusercontent.com/e8DYeGKwyaDgSc8AUmIvGdGsGU_c-_2ceQCb7qkbZZzZ7R5bppKMpL2vnlaIwS04O1Jx4kzd-Q=s176-c-k-c0x00ffffff-no-rj',
  'Nota Bene': 'https://yt3.googleusercontent.com/14yJywmBpZLujps3kbe32_WRi46fZomUBtbnUH4gNh92LMQU0u81K-Y-j433em0AWnBVpP64-Q=s176-c-k-c0x00ffffff-no-rj',
  'Dr Nozman': 'https://yt3.googleusercontent.com/ytc/AIdro_kP-ty6rj41GP6Sddyux8oU5DJu9DLc9feo1bQq27az7XQ=s176-c-k-c0x00ffffff-no-rj',
  'Trash': 'https://yt3.googleusercontent.com/ytc/AIdro_l5icC2DHPjaDA9XI077SmNdVVavo0Ekac9vKXDO5DqDBo=s176-c-k-c0x00ffffff-no-rj',
  'Poisson Fécond': 'https://yt3.googleusercontent.com/_Ns0Bzk-GB5brYu7UNGolj6ndKMUI-sRHX-USdQV9vqN9WI5ZPiqHt1P3wtiahqbQsiWIKG4vps=s176-c-k-c0x00ffffff-no-rj',
  'ScienceEtonnante': 'https://yt3.googleusercontent.com/ytc/AIdro_kzU96H3Lq6fihVVFNWXUEFaidERMvSqyMwn0f455Gi4w=s176-c-k-c0x00ffffff-no-rj',
  'Feldup': 'https://yt3.googleusercontent.com/ytc/AIdro_lOrU0Hx8dg6T_x4P1cFJC2voEwSILEzXgy3pXg71FmiPg=s176-c-k-c0x00ffffff-no-rj',
  'FastGoodCuisine': 'https://yt3.googleusercontent.com/gHkSCYBk4J1lJp3C0bmoh3GDtMsUnXNZEX9IUBzL9GElxRITRJK5s8rU3DINZjEuP3vluRhYnqY=s176-c-k-c0x00ffffff-no-rj',
  'Jojol': 'https://yt3.googleusercontent.com/LynLoLgkMKW3yJ-jx8FwJxAGfPBXnp_RPYJTdkZKag6qhvf68UxGPU1epcREv2o6Kb4YB2178rg=s176-c-k-c0x00ffffff-no-rj',
  'Sofyan': 'https://yt3.googleusercontent.com/p5MQAaAbMe1lcCNQwqCiswpbmbjfJI2UXqX36ho1QMeb5DCtmWqEYviknT0ORNpZzGvRrVEokw=s176-c-k-c0x00ffffff-no-rj',
  'GMK': 'https://yt3.googleusercontent.com/dUPQNmo-biSznsRa11lPuU4LMJIMCfGYspvm0eDwxh0poHr7-0BoLSc0Sx6bvW2LTUk5m1nMWg=s176-c-k-c0x00ffffff-no-rj',
  'Gotaga': 'https://yt3.googleusercontent.com/FQXhwoYYE7tmVnX54Lkp6qDgFbgSpCoTou-yRqcaxwbKRTDEwjpwjH3yFB55nK_p9MinEAvPCm8=s176-c-k-c0x00ffffff-no-rj',
  'ZeratoR': 'https://yt3.googleusercontent.com/0PL7Wid85D5gVRbv2h0FgYrC4H5WPNA0BVya-vmuvz4HuJXgOiB32A7xNXlGulHF7i19WPNpvRs=s176-c-k-c0x00ffffff-no-rj',
  'Domingo': 'https://yt3.googleusercontent.com/6ni5eiKLZZKaN8fVy63KsXlV5girNU23Zb-rmFKN8AmOdVCRx9w0iXsX90LFqsRc4UqQJZMl=s176-c-k-c0x00ffffff-no-rj',
  'Natoo': 'https://yt3.googleusercontent.com/ZpHD9MhNPhlayZ4wVNTX2r5ovCCDgsaQabX_PithFmRrctUR0mZroFmqaWweOnIqAhdXYFSn2g=s176-c-k-c0x00ffffff-no-rj',
};

/**
 * Get avatar URL for a given channel name
 */
export function getChannelAvatar(channelName) {
  if (!channelName) return null;
  return AVATAR_MAP[channelName] || null;
}

/**
 * Register or update avatars from server channel stats
 */
export function registerChannelAvatars(channelsList) {
  if (!Array.isArray(channelsList)) return;
  for (const ch of channelsList) {
    const name = ch.channel || ch.name;
    const url = ch.avatar_url || ch.avatarUrl;
    if (name && url) {
      AVATAR_MAP[name] = url;
    }
  }
}
