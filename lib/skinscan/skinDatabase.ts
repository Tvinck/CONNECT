export interface DbSkin {
  name: string
  nameRu: string
  iconUrl: string
  category: 'rifles' | 'snipers' | 'pistols' | 'knives' | 'gloves'
}

export const SKIN_DATABASE: DbSkin[] = [
  // Rifles
  {
    name: 'AK-47 | Redline',
    nameRu: 'AK-47 | Красная линия',
    iconUrl: '-9a81dlWLwJ2UUGcVs_nsVwgdGYgONVQ3mo3Q1R5ThjKTYbhg_n3rxzTS4qgG5GCZ3Ux5_6zo5ed1-c7vwYc9vO_jOW7C1RpnV1YrOfcnZTsxLHZfTxN6dKy_hK_flgNu5Mbpmnn2p9By2LqYo_vGrQhsyfXzQf1x3_gL7_J8_4',
    category: 'rifles'
  },
  {
    name: 'AK-47 | Asiimov',
    nameRu: 'AK-47 | Азимов',
    iconUrl: '-9a81dlWLwJ2UUGcVs_nsVwgdGYgONVQ3mo3Q1R5ThjKTYbhg_n3rxzTS4qgG5GCZ3Ux5_6zo5ed1-c7vwYc9vO_jOW7C1RpnV1YrOfcnZTsxLHZfTxN6dKy_hK_flgNu5Mbpmnn2p9By2LqYo_vGrQhsyfXzQf1x3_gL7_J8_4',
    category: 'rifles'
  },
  {
    name: 'AK-47 | Vulcan',
    nameRu: 'AK-47 | Вулкан',
    iconUrl: '-9a81dlWLwJ2UUGcVs_nsVwgdGYgONVQ3mo3Q1R5ThjKTYbhg_n3rxzTS4qgG5GCZ3Ux5_6zo5ed1-c7vwYc9vO_jOW7C1RpnV1YrOfcnZTsxLHZfTxN6dKy_hK_flgNu5Mbpmnn2p9By2LqYo_vGrQhsyfXzQf1x3_gL7_J8_4',
    category: 'rifles'
  },
  {
    name: 'AK-47 | Case Hardened',
    nameRu: 'AK-47 | Поверхностная закалка',
    iconUrl: '-9a81dlWLwJ2UUGcVs_nsVwgdGYgONVQ3mo3Q1R5ThjKTYbhg_n3rxzTS4qgG5GCZ3Ux5_6zo5ed1-c7vwYc9vO_jOW7C1RpnV1YrOfcnZTsxLHZfTxN6dKy_hK_flgNu5Mbpmnn2p9By2LqYo_vGrQhsyfXzQf1x3_gL7_J8_4',
    category: 'rifles'
  },
  {
    name: 'AK-47 | The Empress',
    nameRu: 'AK-47 | Императрица',
    iconUrl: '-9a81dlWLwJ2UUGcVs_nsVwgdGYgONVQ3mo3Q1R5ThjKTYbhg_n3rxzTS4qgG5GCZ3Ux5_6zo5ed1-c7vwYc9vO_jOW7C1RpnV1YrOfcnZTsxLHZfTxN6dKy_hK_flgNu5Mbpmnn2p9By2LqYo_vGrQhsyfXzQf1x3_gL7_J8_4',
    category: 'rifles'
  },
  {
    name: 'AK-47 | Neon Rider',
    nameRu: 'AK-47 | Неоновый гонщик',
    iconUrl: '-9a81dlWLwJ2UUGcVs_nsVwgdGYgONVQ3mo3Q1R5ThjKTYbhg_n3rxzTS4qgG5GCZ3Ux5_6zo5ed1-c7vwYc9vO_jOW7C1RpnV1YrOfcnZTsxLHZfTxN6dKy_hK_flgNu5Mbpmnn2p9By2LqYo_vGrQhsyfXzQf1x3_gL7_J8_4',
    category: 'rifles'
  },
  {
    name: 'AK-47 | Fuel Injector',
    nameRu: 'AK-47 | Топливный инжектор',
    iconUrl: '-9a81dlWLwJ2UUGcVs_nsVwgdGYgONVQ3mo3Q1R5ThjKTYbhg_n3rxzTS4qgG5GCZ3Ux5_6zo5ed1-c7vwYc9vO_jOW7C1RpnV1YrOfcnZTsxLHZfTxN6dKy_hK_flgNu5Mbpmnn2p9By2LqYo_vGrQhsyfXzQf1x3_gL7_J8_4',
    category: 'rifles'
  },
  {
    name: 'M4A4 | Howl',
    nameRu: 'M4A4 | Вой',
    iconUrl: '-9a81dlWLwJ2UUGcVs_nsVwgdGYgONVQ3mo3Q1R5ThjKTYbhg_n3rxzTS4qgG5GCZ3Ux5_6zo5ed1-c7vwYc9vO_jOW7C1RpnV1YrOfcnZTsxLHZfTxN6dKy_hK_flgNu5Mbpmnn2p9By2LqYo_vGrQhsyfXzQf1x3_gL7_J8_4',
    category: 'rifles'
  },
  {
    name: 'M4A4 | Asiimov',
    nameRu: 'M4A4 | Азимов',
    iconUrl: '-9a81dlWLwJ2UUGcVs_nsVwgdGYgONVQ3mo3Q1R5ThjKTYbhg_n3rxzTS4qgG5GCZ3Ux5_6zo5ed1-c7vwYc9vO_jOW7C1RpnV1YrOfcnZTsxLHZfTxN6dKy_hK_flgNu5Mbpmnn2p9By2LqYo_vGrQhsyfXzQf1x3_gL7_J8_4',
    category: 'rifles'
  },
  {
    name: 'M4A1-S | Printstream',
    nameRu: 'M4A1-S | Поток информации',
    iconUrl: '-9a81dlWLwJ2UUGcVs_nsVwgdGYgONVQ3mo3Q1R5ThjKTYbhg_n3rxzTS4qgG5GCZ3Ux5_6zo5ed1-c7vwYc9vO_jOW7C1RpnV1YrOfcnZTsxLHZfTxN6dKy_hK_flgNu5Mbpmnn2p9By2LqYo_vGrQhsyfXzQf1x3_gL7_J8_4',
    category: 'rifles'
  },
  {
    name: 'M4A1-S | Hyper Beast',
    nameRu: 'M4A1-S | Скоростной зверь',
    iconUrl: '-9a81dlWLwJ2UUGcVs_nsVwgdGYgONVQ3mo3Q1R5ThjKTYbhg_n3rxzTS4qgG5GCZ3Ux5_6zo5ed1-c7vwYc9vO_jOW7C1RpnV1YrOfcnZTsxLHZfTxN6dKy_hK_flgNu5Mbpmnn2p9By2LqYo_vGrQhsyfXzQf1x3_gL7_J8_4',
    category: 'rifles'
  },

  // Snipers
  {
    name: 'AWP | Dragon Lore',
    nameRu: 'AWP | История о драконе',
    iconUrl: '-9a81dlWLwJ2UUGcVs_nsVwgdGYgONVQ3mo3Q1R5ThjKTYbhg_n3rxzTS4qgG5GCZ3Ux5_6zo5ed1-c7vwYc9vO_jOW7C1RpnV1YrOfcnZTsxLHZfTxN6dKy_hK_flgNu5Mbpmnn2p9By2LqYo_vGrQhsyfXzQf1x3_gL7_J8_4',
    category: 'snipers'
  },
  {
    name: 'AWP | Asiimov',
    nameRu: 'AWP | Азимов',
    iconUrl: '-9a81dlWLwJ2UUGcVs_nsVwgdGYgONVQ3mo3Q1R5ThjKTYbhg_n3rxzTS4qgG5GCZ3Ux5_6zo5ed1-c7vwYc9vO_jOW7C1RpnV1YrOfcnZTsxLHZfTxN6dKy_hK_flgNu5Mbpmnn2p9By2LqYo_vGrQhsyfXzQf1x3_gL7_J8_4',
    category: 'snipers'
  },
  {
    name: 'AWP | Gungnir',
    nameRu: 'AWP | Гунгнир',
    iconUrl: '-9a81dlWLwJ2UUGcVs_nsVwgdGYgONVQ3mo3Q1R5ThjKTYbhg_n3rxzTS4qgG5GCZ3Ux5_6zo5ed1-c7vwYc9vO_jOW7C1RpnV1YrOfcnZTsxLHZfTxN6dKy_hK_flgNu5Mbpmnn2p9By2LqYo_vGrQhsyfXzQf1x3_gL7_J8_4',
    category: 'snipers'
  },
  {
    name: 'AWP | Desert Hydra',
    nameRu: 'AWP | Пустынная гидра',
    iconUrl: '-9a81dlWLwJ2UUGcVs_nsVwgdGYgONVQ3mo3Q1R5ThjKTYbhg_n3rxzTS4qgG5GCZ3Ux5_6zo5ed1-c7vwYc9vO_jOW7C1RpnV1YrOfcnZTsxLHZfTxN6dKy_hK_flgNu5Mbpmnn2p9By2LqYo_vGrQhsyfXzQf1x3_gL7_J8_4',
    category: 'snipers'
  },
  {
    name: 'AWP | Hyper Beast',
    nameRu: 'AWP | Скоростной зверь',
    iconUrl: '-9a81dlWLwJ2UUGcVs_nsVwgdGYgONVQ3mo3Q1R5ThjKTYbhg_n3rxzTS4qgG5GCZ3Ux5_6zo5ed1-c7vwYc9vO_jOW7C1RpnV1YrOfcnZTsxLHZfTxN6dKy_hK_flgNu5Mbpmnn2p9By2LqYo_vGrQhsyfXzQf1x3_gL7_J8_4',
    category: 'snipers'
  },

  // Pistols
  {
    name: 'USP-S | Kill Confirmed',
    nameRu: 'USP-S | Подтвержденное убийство',
    iconUrl: '-9a81dlWLwJ2UUGcVs_nsVwgdGYgONVQ3mo3Q1R5ThjKTYbhg_n3rxzTS4qgG5GCZ3Ux5_6zo5ed1-c7vwYc9vO_jOW7C1RpnV1YrOfcnZTsxLHZfTxN6dKy_hK_flgNu5Mbpmnn2p9By2LqYo_vGrQhsyfXzQf1x3_gL7_J8_4',
    category: 'pistols'
  },
  {
    name: 'USP-S | Neo-Noir',
    nameRu: 'USP-S | Нео-нуар',
    iconUrl: '-9a81dlWLwJ2UUGcVs_nsVwgdGYgONVQ3mo3Q1R5ThjKTYbhg_n3rxzTS4qgG5GCZ3Ux5_6zo5ed1-c7vwYc9vO_jOW7C1RpnV1YrOfcnZTsxLHZfTxN6dKy_hK_flgNu5Mbpmnn2p9By2LqYo_vGrQhsyfXzQf1x3_gL7_J8_4',
    category: 'pistols'
  },
  {
    name: 'Glock-18 | Fade',
    nameRu: 'Glock-18 | Градиент',
    iconUrl: '-9a81dlWLwJ2UUGcVs_nsVwgdGYgONVQ3mo3Q1R5ThjKTYbhg_n3rxzTS4qgG5GCZ3Ux5_6zo5ed1-c7vwYc9vO_jOW7C1RpnV1YrOfcnZTsxLHZfTxN6dKy_hK_flgNu5Mbpmnn2p9By2LqYo_vGrQhsyfXzQf1x3_gL7_J8_4',
    category: 'pistols'
  },
  {
    name: 'Glock-18 | Water Elemental',
    nameRu: 'Glock-18 | Водяной элементаль',
    iconUrl: '-9a81dlWLwJ2UUGcVs_nsVwgdGYgONVQ3mo3Q1R5ThjKTYbhg_n3rxzTS4qgG5GCZ3Ux5_6zo5ed1-c7vwYc9vO_jOW7C1RpnV1YrOfcnZTsxLHZfTxN6dKy_hK_flgNu5Mbpmnn2p9By2LqYo_vGrQhsyfXzQf1x3_gL7_J8_4',
    category: 'pistols'
  },
  {
    name: 'Desert Eagle | Blaze',
    nameRu: 'Desert Eagle | Пламя',
    iconUrl: '-9a81dlWLwJ2UUGcVs_nsVwgdGYgONVQ3mo3Q1R5ThjKTYbhg_n3rxzTS4qgG5GCZ3Ux5_6zo5ed1-c7vwYc9vO_jOW7C1RpnV1YrOfcnZTsxLHZfTxN6dKy_hK_flgNu5Mbpmnn2p9By2LqYo_vGrQhsyfXzQf1x3_gL7_J8_4',
    category: 'pistols'
  },
  {
    name: 'Desert Eagle | Printstream',
    nameRu: 'Desert Eagle | Поток информации',
    iconUrl: '-9a81dlWLwJ2UUGcVs_nsVwgdGYgONVQ3mo3Q1R5ThjKTYbhg_n3rxzTS4qgG5GCZ3Ux5_6zo5ed1-c7vwYc9vO_jOW7C1RpnV1YrOfcnZTsxLHZfTxN6dKy_hK_flgNu5Mbpmnn2p9By2LqYo_vGrQhsyfXzQf1x3_gL7_J8_4',
    category: 'pistols'
  },

  // Knives
  {
    name: '★ Karambit | Fade',
    nameRu: '★ Керамбит | Градиент',
    iconUrl: '-9a81dlWLwJ2UUGcVs_nsVwgdGYgONVQ3mo3Q1R5ThjKTYbhg_n3rxzTS4qgG5GCZ3Ux5_6zo5ed1-c7vwYc9vO_jOW7C1RpnV1YrOfcnZTsxLHZfTxN6dKy_hK_flgNu5Mbpmnn2p9By2LqYo_vGrQhsyfXzQf1x3_gL7_J8_4',
    category: 'knives'
  },
  {
    name: '★ Karambit | Doppler',
    nameRu: '★ Керамбит | Волны',
    iconUrl: '-9a81dlWLwJ2UUGcVs_nsVwgdGYgONVQ3mo3Q1R5ThjKTYbhg_n3rxzTS4qgG5GCZ3Ux5_6zo5ed1-c7vwYc9vO_jOW7C1RpnV1YrOfcnZTsxLHZfTxN6dKy_hK_flgNu5Mbpmnn2p9By2LqYo_vGrQhsyfXzQf1x3_gL7_J8_4',
    category: 'knives'
  },
  {
    name: '★ M9 Bayonet | Doppler',
    nameRu: '★ Штык-нож M9 | Волны',
    iconUrl: '-9a81dlWLwJ2UUGcVs_nsVwgdGYgONVQ3mo3Q1R5ThjKTYbhg_n3rxzTS4qgG5GCZ3Ux5_6zo5ed1-c7vwYc9vO_jOW7C1RpnV1YrOfcnZTsxLHZfTxN6dKy_hK_flgNu5Mbpmnn2p9By2LqYo_vGrQhsyfXzQf1x3_gL7_J8_4',
    category: 'knives'
  },
  {
    name: '★ Butterfly Knife | Fade',
    nameRu: '★ Нож-бабочка | Градиент',
    iconUrl: '-9a81dlWLwJ2UUGcVs_nsVwgdGYgONVQ3mo3Q1R5ThjKTYbhg_n3rxzTS4qgG5GCZ3Ux5_6zo5ed1-c7vwYc9vO_jOW7C1RpnV1YrOfcnZTsxLHZfTxN6dKy_hK_flgNu5Mbpmnn2p9By2LqYo_vGrQhsyfXzQf1x3_gL7_J8_4',
    category: 'knives'
  },
  {
    name: '★ Butterfly Knife | Crimson Web',
    nameRu: '★ Нож-бабочка | Кровавая паутина',
    iconUrl: '-9a81dlWLwJ2UUGcVs_nsVwgdGYgONVQ3mo3Q1R5ThjKTYbhg_n3rxzTS4qgG5GCZ3Ux5_6zo5ed1-c7vwYc9vO_jOW7C1RpnV1YrOfcnZTsxLHZfTxN6dKy_hK_flgNu5Mbpmnn2p9By2LqYo_vGrQhsyfXzQf1x3_gL7_J8_4',
    category: 'knives'
  },
  {
    name: '★ Talon Knife | Marble Fade',
    nameRu: '★ Нож-коготь | Мраморный градиент',
    iconUrl: '-9a81dlWLwJ2UUGcVs_nsVwgdGYgONVQ3mo3Q1R5ThjKTYbhg_n3rxzTS4qgG5GCZ3Ux5_6zo5ed1-c7vwYc9vO_jOW7C1RpnV1YrOfcnZTsxLHZfTxN6dKy_hK_flgNu5Mbpmnn2p9By2LqYo_vGrQhsyfXzQf1x3_gL7_J8_4',
    category: 'knives'
  },

  // Gloves
  {
    name: '★ Sport Gloves | Pandora\'s Box',
    nameRu: '★ Спортивные перчатки | Ящик Пандоры',
    iconUrl: '-9a81dlWLwJ2UUGcVs_nsVwgdGYgONVQ3mo3Q1R5ThjKTYbhg_n3rxzTS4qgG5GCZ3Ux5_6zo5ed1-c7vwYc9vO_jOW7C1RpnV1YrOfcnZTsxLHZfTxN6dKy_hK_flgNu5Mbpmnn2p9By2LqYo_vGrQhsyfXzQf1x3_gL7_J8_4',
    category: 'gloves'
  },
  {
    name: '★ Specialist Gloves | Crimson Kimono',
    nameRu: '★ Перчатки «Специалист» | Кровавое кимоно',
    iconUrl: '-9a81dlWLwJ2UUGcVs_nsVwgdGYgONVQ3mo3Q1R5ThjKTYbhg_n3rxzTS4qgG5GCZ3Ux5_6zo5ed1-c7vwYc9vO_jOW7C1RpnV1YrOfcnZTsxLHZfTxN6dKy_hK_flgNu5Mbpmnn2p9By2LqYo_vGrQhsyfXzQf1x3_gL7_J8_4',
    category: 'gloves'
  },
  {
    name: '★ Driver Gloves | Imperial Plaid',
    nameRu: '★ Водительские перчатки | Имперская клетка',
    iconUrl: '-9a81dlWLwJ2UUGcVs_nsVwgdGYgONVQ3mo3Q1R5ThjKTYbhg_n3rxzTS4qgG5GCZ3Ux5_6zo5ed1-c7vwYc9vO_jOW7C1RpnV1YrOfcnZTsxLHZfTxN6dKy_hK_flgNu5Mbpmnn2p9By2LqYo_vGrQhsyfXzQf1x3_gL7_J8_4',
    category: 'gloves'
  }
]
