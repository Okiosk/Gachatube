/**
 * Channel Avatars provider for GachaTube cards
 * Maps channel names to official YouTube avatar URLs (yt3.googleusercontent.com)
 * Total channels: 84
 */

const AVATAR_MAP = {
  "Amixem": "https://yt3.googleusercontent.com/mkxR4YNTUBJAjuq020488wM8yHSCZ4Kwn0etJyYyGTL86LnEiIzu5uhw8EwmPpRxavKYXyQ4Hmk=s176-c-k-c0x00ffffff-no-rj",
  "Antoine Daniel": "https://yt3.googleusercontent.com/ytc/AIdro_kRdyCH6MmWSuY9WJsXaBNNK8uvDPY0ayuBe3YGr-QIDDg=s176-c-k-c0x00ffffff-no-rj",
  "Anyme": "https://yt3.googleusercontent.com/h5Cl-YBSRRSBrXdPP0IIGFYb8ojlyC9vx3NjUqkdDPuNE3Z5MIw8Dq6Vs2x0-ryFprUxw0mjCjw=s176-c-k-c0x00ffffff-no-rj",
  "Astronogeek": "https://yt3.googleusercontent.com/8e1-6kx0mo8BRgIkkO4u7auZlaACmHyAvaEeEtl1mW6csiZtli6p-PHDi7-R5ZkT-Afr98X_=s176-c-k-c0x00ffffff-no-rj",
  "Aypierre": "https://yt3.googleusercontent.com/Ssc_ZFkmMBlG-LfoBsF394oQU2T1zdZF1HC5KXjUIzRjUYASlnzf5bP9c1XGhekfoVqr60fU=s176-c-k-c0x00ffffff-no-rj",
  "Balade Mentale": "https://yt3.googleusercontent.com/G9u5bB4UgW8oF21MNIDMnZyhdt7f1VoWbVWlpwHskNQb2ONvdIz6YUjq1DlHMo3_jasdU9vV=s176-c-k-c0x00ffffff-no-rj",
  "Bazar du Grenier": "https://yt3.googleusercontent.com/ytc/AIdro_lT3H1EgSPtO3w486wr8nI-KNOy2Yo38gsTfuoBFg8Uh4A=s176-c-k-c0x00ffffff-no-rj",
  "Captain Popcorn": "https://yt3.googleusercontent.com/ytc/AIdro_mrvTKYDN9-zSHrhhpkrfo2vAk4T2Q8NXqXqX38_3O0VA=s176-c-k-c0x00ffffff-no-rj",
  "Colas Bim": "https://yt3.googleusercontent.com/ytc/AIdro_m9QwD0VVQdir35Mghj7DPqB58Hf8b4jN4amEgY9mBsLw=s176-c-k-c0x00ffffff-no-rj",
  "Cyprien": "https://yt3.googleusercontent.com/ytc/AIdro_kKiE1Vpd2RZMv057AzKdHBtqkL7ksZhZ4Huwfbr9ngUyU=s176-c-k-c0x00ffffff-no-rj",
  "Cyrus North": "https://yt3.googleusercontent.com/ytc/AIdro_mHAFHVIvsQA_d6FzOsUusZBnw81yEOmfl70kAaBDcGCU4=s176-c-k-c0x00ffffff-no-rj",
  "David Lafarge Pokemon": "https://yt3.googleusercontent.com/Ci9KRrnh-R5_xBFJ52Xwxly34QwtcsvXoZdrJSKzpuR_LwKQq5GN0GKA-r7_hraSDsHviD0W=s176-c-k-c0x00ffffff-no-rj",
  "Doc Seven": "https://yt3.googleusercontent.com/ObjZlE5C38vo0syeaQtuo-HaIZ7567CL2UlgmplDeUAsi7evzsAftQMhPVBtLq8GglTPuEV3N68=s176-c-k-c0x00ffffff-no-rj",
  "Doigby": "https://yt3.googleusercontent.com/pNm3fVJ4PaB0GW9yD0U0v4_FEw_aFiRwxYiJrECct2pVHTPoiq-v9TcGH4YU9zoX2NCJF4SZ=s176-c-k-c0x00ffffff-no-rj",
  "Domingo": "https://yt3.googleusercontent.com/6ni5eiKLZZKaN8fVy63KsXlV5girNU23Zb-rmFKN8AmOdVCRx9w0iXsX90LFqsRc4UqQJZMl=s176-c-k-c0x00ffffff-no-rj",
  "Dr Nozman": "https://yt3.googleusercontent.com/ytc/AIdro_kP-ty6rj41GP6Sddyux8oU5DJu9DLc9feo1bQq27az7XQ=s176-c-k-c0x00ffffff-no-rj",
  "Durendal": "https://yt3.googleusercontent.com/ytc/AIdro_nyg5SEsBFAXXhR0Y7Wbk79RAyI33nLEdhV1C8yrsIBYuY=s176-c-k-c0x00ffffff-no-rj",
  "e-penser": "https://yt3.googleusercontent.com/AWBLQw7ycjLFeMYfEAJbn28ZMXAxoV-74SN8dLsP0fxbPWFuLg5CuXgZKV_71A4KYeqxApx9=s176-c-k-c0x00ffffff-no-rj",
  "FabienOlicard": "https://yt3.googleusercontent.com/hOu5CGjWlGlRYry-hXYT20RX4D5XkZcxJ_DOfkz24oK2-UQKLSJjhkhdaZtSxcY2eS8X8PVr=s176-c-k-c0x00ffffff-no-rj",
  "Farod": "https://yt3.googleusercontent.com/dlLrxu__PxBZBBg_Y9OoUdQQpMNlXOpy8yHaTlVVHqZzHjlDHVojBMWD3YFtiA7V-PirB2hcNA=s176-c-k-c0x00ffffff-no-rj",
  "FastGoodCuisine": "https://yt3.googleusercontent.com/gHkSCYBk4J1lJp3C0bmoh3GDtMsUnXNZEX9IUBzL9GElxRITRJK5s8rU3DINZjEuP3vluRhYnqY=s176-c-k-c0x00ffffff-no-rj",
  "Feldup": "https://yt3.googleusercontent.com/ytc/AIdro_lOrU0Hx8dg6T_x4P1cFJC2voEwSILEzXgy3pXg71FmiPg=s176-c-k-c0x00ffffff-no-rj",
  "Frigiel": "https://yt3.googleusercontent.com/ytc/AIdro_kgShYZ1YzaXOBkKZVcNEIFsG0gW8f7lRBSa6Iiztcm_OE=s176-c-k-c0x00ffffff-no-rj",
  "Fuze III": "https://yt3.googleusercontent.com/ouC_QbObGHFr-Wf9Mg9fzZTgK-PqpE_vwI53eOy1coC4LYtYwqUDHjHXLfrraLtDPOzKzY1yGA=s176-c-k-c0x00ffffff-no-rj",
  "Gaspard G": "https://yt3.googleusercontent.com/UngGpqldNtqpl-eM3tphnYJopULu_1MAoHaKkORaZciN9qtCLDBlmsHA9lkqlNKOb6UuLUxjKA=s176-c-k-c0x00ffffff-no-rj",
  "GMK": "https://yt3.googleusercontent.com/dUPQNmo-biSznsRa11lPuU4LMJIMCfGYspvm0eDwxh0poHr7-0BoLSc0Sx6bvW2LTUk5m1nMWg=s176-c-k-c0x00ffffff-no-rj",
  "Golden Moustache": "https://yt3.googleusercontent.com/p3WMcSMKVkeK_h8s6U68geE9yzWi6khMjCRyk3gT__vY60dnVXbFHCVev3V9hWvEKKvEY4um=s176-c-k-c0x00ffffff-no-rj",
  "Gotaga": "https://yt3.googleusercontent.com/FQXhwoYYE7tmVnX54Lkp6qDgFbgSpCoTou-yRqcaxwbKRTDEwjpwjH3yFB55nK_p9MinEAvPCm8=s176-c-k-c0x00ffffff-no-rj",
  "GouvHD": "https://yt3.googleusercontent.com/WkqP1qYUMhWHfeqj9sQwp2plk4EB0mecDCG0CF152i9OCjmBTFRfLwrEsdnexE6xGqNcok3p1g=s176-c-k-c0x00ffffff-no-rj",
  "Greg Guillotin": "https://yt3.googleusercontent.com/j3xlM3Ok7ggG7VyuFRBuv1nGV-uwOOvTej3XABDPiYWZdHvQ0e8CY-X9rkX1Yt3STWJILx2RIw=s176-c-k-c0x00ffffff-no-rj",
  "HugoDécrypte": "https://yt3.googleusercontent.com/doPajjcwkXA71S2WCZsvhXSGapCsp46InwN9048iQa327OXZwxXvXJCY3FnGL6BpymL4k9jATA=s176-c-k-c0x00ffffff-no-rj",
  "Inoxtag": "https://yt3.googleusercontent.com/ytc/AIdro_nBv_ScBglsYmGLCeX8gG5E7_rC-p9M0I4hQAcEMaHjJa4=s176-c-k-c0x00ffffff-no-rj",
  "Jeel": "https://yt3.googleusercontent.com/ytc/AIdro_nb0KWkXq5nzyPxrtU3nUB67xgPbBc-EafNZSAI1YBgKA=s176-c-k-c0x00ffffff-no-rj",
  "Jojol": "https://yt3.googleusercontent.com/LynLoLgkMKW3yJ-jx8FwJxAGfPBXnp_RPYJTdkZKag6qhvf68UxGPU1epcREv2o6Kb4YB2178rg=s176-c-k-c0x00ffffff-no-rj",
  "Joueur Du Grenier": "https://yt3.googleusercontent.com/ytc/AIdro_l5M7wAHM9QledrlSHNomrm8tV-pTAyzUiFtL7iSVFUIA=s176-c-k-c0x00ffffff-no-rj",
  "Joyca": "https://yt3.googleusercontent.com/F5R-8dCR4OsDu1Rs_2RE20e6LUNFDJW6VemSqToit8XvdfoSj1DXJXb0Dc4aT_YEv-5TsFCF=s176-c-k-c0x00ffffff-no-rj",
  "Juju Fitcats": "https://yt3.googleusercontent.com/oZdXk9L-y6Vao5vqhESNmfzlKlgOsyGNY7HfUlDvxOviYoHDkIqcBGMwwa8Lry8xTD6QQEvO=s176-c-k-c0x00ffffff-no-rj",
  "Kaatsup": "https://yt3.googleusercontent.com/XXaRZBpo4KSkVeokVjiyZGXIwmb0w4gQBioGRGxDGw5uLMPrtDgQ36ksJMnR7Onq7suLcWrYPg=s176-c-k-c0x00ffffff-no-rj",
  "L'Atelier de Roxane": "https://yt3.googleusercontent.com/W2qMfppziCxWMEt8GO-9iO4I1_5r68j9gcWg3QVT7DnRK9Vf4Dm20j4GX_nPJ6KY9vyACkXCpA=s176-c-k-c0x00ffffff-no-rj",
  "Le Grand JD": "https://yt3.googleusercontent.com/ytc/AIdro_l4Pra23FO6-vPtWRXDhtSjnuSQnLF4SGsipS0Lh1MndPk=s176-c-k-c0x00ffffff-no-rj",
  "Le Roi des Rats": "https://yt3.googleusercontent.com/ytc/AIdro_lkjgAEFbZMHlKDrQ86LYpeFhbRZUxel3QZzvYovG8qJW8=s176-c-k-c0x00ffffff-no-rj",
  "Le Règlement": "https://yt3.googleusercontent.com/ytc/AIdro_mnLx6WOK3P4lhw55lnqXQdBDWAf_7r-6MmPn1vYWjU5g=s176-c-k-c0x00ffffff-no-rj",
  "Le Tatou": "https://yt3.googleusercontent.com/ytc/AIdro_ms85_dFhY2TphfDAzPgSS9Fpvyex79QTGh04fmgC11nkk=s176-c-k-c0x00ffffff-no-rj",
  "LeBouseuh": "https://yt3.googleusercontent.com/-ddkoZcrriwdAFiRPEBCTBqnU6p8w6fP5WdsG-k2MTo2DM0q_CmpZYKeIVgz4MQcaQ37Vn6S-ek=s176-c-k-c0x00ffffff-no-rj",
  "Linguisticae": "https://yt3.googleusercontent.com/ytc/AIdro_lvbGke3TxabYtGC2iOVSLOXcVz5WQcU9p2FscTUOXWp2Y=s176-c-k-c0x00ffffff-no-rj",
  "Linksthesun": "https://yt3.googleusercontent.com/ytc/AIdro_n-eVWXJhARWr-VZdKBZIM-xnIl7Ab-sbNnQVSkGkrqDqM=s176-c-k-c0x00ffffff-no-rj",
  "Lolywood": "https://yt3.googleusercontent.com/QVK2nZsI9S4rCZX2EZFYvryUD0WFj3aNwDg4BMvbWBA3hIws2FU-FPgbFF2Ht6gTc7-Q9kGTbEI=s176-c-k-c0x00ffffff-no-rj",
  "Louis-San": "https://yt3.googleusercontent.com/ytc/AIdro_lRX5Dn0hha1n_Lg7Xk6xu-aK3AT8FsyI52VOqFuB1FBVA=s176-c-k-c0x00ffffff-no-rj",
  "Lucas Studio": "https://yt3.googleusercontent.com/Lwt1cNZGjzEadFgaVFUv8ACoZkztRNi_5boo_9thmpIyqPVICEWJZIAOB3JQwP-HaOWmhiP3_g=s176-c-k-c0x00ffffff-no-rj",
  "Léna Situations": "https://yt3.googleusercontent.com/d2MpFvheu0xlCTovS837oS2ji_DNdnE-MWf2OsWDqohUV3YP-wv7a7TCxDh1sRP0T9SxP2VudCo=s176-c-k-c0x00ffffff-no-rj",
  "Maghla": "https://yt3.googleusercontent.com/AmhkX5Jeh3m8pbAs-yzlOXKC9R530xqjkO20U48J0iIvgaBCrjym-9Xi_UNATFJE8meaVbcbfsY=s176-c-k-c0x00ffffff-no-rj",
  "Mamytwink": "https://yt3.googleusercontent.com/ytc/AIdro_mp8tQ_LQD5mJBzREOS3jW1-F74K6JOORZO6XlZxxIprFo=s176-c-k-c0x00ffffff-no-rj",
  "Mastu": "https://yt3.googleusercontent.com/ytc/AIdro_kcL_PnNz1KEjLIQ7veCTq_0Vv7tktG0oth4M0_NZp8PRw=s176-c-k-c0x00ffffff-no-rj",
  "Mathieu Sommet": "https://yt3.googleusercontent.com/ytc/AIdro_nw1M4eTuHdMtT8r7K6Sr5TyYjqPCZF-j0oz843meq7fEQ=s176-c-k-c0x00ffffff-no-rj",
  "Maxime Biaggi": "https://yt3.googleusercontent.com/ZsmiOA_7qianJlnzgnv657o6txt_wAC-Vw99yzAqfxjAPW9hojrQs_QMEHYTPR6tR3KJzYlUw2U=s176-c-k-c0x00ffffff-no-rj",
  "Mcfly et Carlito": "https://yt3.googleusercontent.com/ytc/AIdro_kSPG3h89eFoHhkLFYl_VQ6OkFpLCfpZUSuIWkRJt0sI-E=s176-c-k-c0x00ffffff-no-rj",
  "Michou": "https://yt3.googleusercontent.com/AbT6_C0E4bzscwpKqfdeMg6wTCuo_5pP9lkeqcLBFtqbgJsf8GaRGBAUnf7ZuNwEuiTHA7fI=s176-c-k-c0x00ffffff-no-rj",
  "Mister V": "https://yt3.googleusercontent.com/9waBvH5yP5jTNSGZ-n9Na5ldf3vnzmFOEjv6PUEuCiaRkfffk50GpF6nkDleoapVrR22Uupm8Lc=s176-c-k-c0x00ffffff-no-rj",
  "Natoo": "https://yt3.googleusercontent.com/ZpHD9MhNPhlayZ4wVNTX2r5ovCCDgsaQabX_PithFmRrctUR0mZroFmqaWweOnIqAhdXYFSn2g=s176-c-k-c0x00ffffff-no-rj",
  "Norman": "https://yt3.googleusercontent.com/6DAgneBRFbtYqCZRBcw26JpmyKT4CNcU36GZ-OGwOvVbNBkTewuBxmZSnot22FPQecPDxf1LZbc=s176-c-k-c0x00ffffff-no-rj",
  "Nota Bene": "https://yt3.googleusercontent.com/14yJywmBpZLujps3kbe32_WRi46fZomUBtbnUH4gNh92LMQU0u81K-Y-j433em0AWnBVpP64-Q=s176-c-k-c0x00ffffff-no-rj",
  "Palmashow": "https://yt3.googleusercontent.com/6SXPLUXh4beliLg-JgvH9QZuEuIo__GfFp9ABHx2teMf4U5aAXyNWqFjT6HtLIlsY6hil3xz=s176-c-k-c0x00ffffff-no-rj",
  "Pape San": "https://yt3.googleusercontent.com/ytc/AIdro_naOsJSXiKPX8AItqGcRSJ0sHd8aoK4Sc4JZDwFQJO8fOY=s176-c-k-c0x00ffffff-no-rj",
  "Pidi": "https://yt3.googleusercontent.com/ytc/AIdro_nKkIBEl86bDoyoZYcEvMwbd0x5Axmi0i87zaV1WT0oqGA60CgbEDEinqUAaa9pb4TwIQ=s176-c-k-c0x00ffffff-no-rj",
  "Pierre Croce": "https://yt3.googleusercontent.com/nITpEppzrNhVmiOCzBsmwQdjzaJ-qJnz4KKwqhbfXgTxdAkKP8ITAz3dlmdIOLPnm4nyxBdbOA=s176-c-k-c0x00ffffff-no-rj",
  "Poisson Fécond": "https://yt3.googleusercontent.com/_Ns0Bzk-GB5brYu7UNGolj6ndKMUI-sRHX-USdQV9vqN9WI5ZPiqHt1P3wtiahqbQsiWIKG4vps=s176-c-k-c0x00ffffff-no-rj",
  "ScienceEtonnante": "https://yt3.googleusercontent.com/ytc/AIdro_kzU96H3Lq6fihVVFNWXUEFaidERMvSqyMwn0f455Gi4w=s176-c-k-c0x00ffffff-no-rj",
  "Scilabus": "https://yt3.googleusercontent.com/xpZCysdkLeBu130mA1nwOj7sbn8uVB3frCGkNkf1mUVAdjSvsVSXIvR4ffwC9gTbGYc_7N0-og=s176-c-k-c0x00ffffff-no-rj",
  "Seb la Frite": "https://yt3.googleusercontent.com/rvhrWfq5r2kSDFm8FWblEvHEaC-sMHFkcO2cci0Dmkp3TIAMXbGXp97nW27orkfv0Qd5auCC1A=s176-c-k-c0x00ffffff-no-rj",
  "Siphano": "https://yt3.googleusercontent.com/LQ736vzrK_IUFAzQGpHms0r6jbLDPc9yqnI1wu0Hkx6blUpaqL8lKTEXJMjp-gG6hAN6haVf-A=s176-c-k-c0x00ffffff-no-rj",
  "Sofyan": "https://yt3.googleusercontent.com/p5MQAaAbMe1lcCNQwqCiswpbmbjfJI2UXqX36ho1QMeb5DCtmWqEYviknT0ORNpZzGvRrVEokw=s176-c-k-c0x00ffffff-no-rj",
  "Squeezie": "https://yt3.googleusercontent.com/ytc/AIdro_mPZvx-xk6pbAYdC7G8jUZzgCNDDTg1ZfF0_Lwd8UpJT4M=s176-c-k-c0x00ffffff-no-rj",
  "Studio Bagel": "https://yt3.googleusercontent.com/lBn7AF8kxnU7qijRluhSxlQuXCOPhVj__ialrcOH1IZMUpZ1AmuHhLadbl2HFGNOAgFjMzNGEw=s176-c-k-c0x00ffffff-no-rj",
  "Sylvain Levy": "https://yt3.googleusercontent.com/VIUzUgC_byAkR-ZVQkcTNeu1bV2DL1r4edu993uQwKMwh14vrffbnZJUKRTM-G6-JVac1d8Vd2E=s176-c-k-c0x00ffffff-no-rj",
  "Tartin": "https://yt3.googleusercontent.com/2nOthowGD8qHgxtnbO3-JjqGCfqM313Gn1Ku1KxRLE_VophsYHMWCZK-bj4O3lsNwyauJV1bdw=s176-c-k-c0x00ffffff-no-rj",
  "Tev - Ici Japon": "https://yt3.googleusercontent.com/ytc/AIdro_kQjIRg3ygnpUUEM_4aIiSM4e-3-ueoWRFQGm9kJR_VbA0=s176-c-k-c0x00ffffff-no-rj",
  "Theguill84": "https://yt3.googleusercontent.com/5YEo46GSlXZ400VgIxc0R4DJPlE3LJBGcYKvgXhJfaNt4shiq662vlw66WPk22On7qYUZqycew=s176-c-k-c0x00ffffff-no-rj",
  "Theodort": "https://yt3.googleusercontent.com/DIpMtXgk489salezQ7C9Dlj7Y1CIzOIu8sG0HC84Y1jqVa_fVxQ6dq7-7up0nqq5H1NBr_PEYY8=s176-c-k-c0x00ffffff-no-rj",
  "Théo Babac": "https://yt3.googleusercontent.com/2tRV942kjKPu7lpwZGRdUYHZLjAFx_ZOaQcbSNX8WtOhF_0AldWqd2kNDQuFn8AX_PVjzjxUYD4=s176-c-k-c0x00ffffff-no-rj",
  "Tibo InShape": "https://yt3.googleusercontent.com/MXKYsX4ryzhIwTLMwBUvx6eoWMcaF-gsHO_PLidZMEKyFj-eKyg9u0IykU8uh7ejCAS9omOlyP8=s176-c-k-c0x00ffffff-no-rj",
  "Trash": "https://yt3.googleusercontent.com/ytc/AIdro_l5icC2DHPjaDA9XI077SmNdVVavo0Ekac9vKXDO5DqDBo=s176-c-k-c0x00ffffff-no-rj",
  "Valouzz": "https://yt3.googleusercontent.com/hDOnknHPy--7v7yClxD5YPxyDEGI0UZIiB2ZmPNfAItxwyedBrvz3HsXaG6LSsVOajog6sGujg=s176-c-k-c0x00ffffff-no-rj",
  "Wankil Studio": "https://yt3.googleusercontent.com/e8DYeGKwyaDgSc8AUmIvGdGsGU_c-_2ceQCb7qkbZZzZ7R5bppKMpL2vnlaIwS04O1Jx4kzd-Q=s176-c-k-c0x00ffffff-no-rj",
  "ZeratoR": "https://yt3.googleusercontent.com/0PL7Wid85D5gVRbv2h0FgYrC4H5WPNA0BVya-vmuvz4HuJXgOiB32A7xNXlGulHF7i19WPNpvRs=s176-c-k-c0x00ffffff-no-rj"
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
