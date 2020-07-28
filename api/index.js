import dataProvider from '@/api/dataProvider';
import { CREATE, DELETE, GET_MANY_REFERENCE } from '@/api/hydra/dataFetchActions';

/**
 * Удаление лайка = дислайк
 * @param {string} hydraId
 * @return {Promise}
 */
export const deleteLike = hydraId => (
  dataProvider({
    type: DELETE,
    params: {
      id: hydraId,
    },
  })
);

/**
 * Создание лайка
 * @param {string} resource
 * @param {string} targetHydraId
 * @return {Promise}
 */
export const createLike = (resource, targetHydraId) => (
  dataProvider({
    type: CREATE,
    resource,
    params: {
      data: JSON.stringify({
        target: targetHydraId,
      }),
    },
  })
);

/**
 * Получение всех лайков
 * @param {string} resource
 * @param {string} hydraId
 * @return {Promise}
 */
export const getLikes = (resource, hydraId) => (
  dataProvider({
    type: GET_MANY_REFERENCE,
    resource,
    params: {
      pagination: {
        itemsPerPage: 1,
      },
      filter: {
        target: hydraId,
      },
    },
  })
);

/**
 * Загрузка HydraId лайка, который ставил текущий пользователь (если ставил)
 * @param {string} resource
 * @param {string} hydraId
 * @param {string} userName
 * @return {Promise<{}|{data: *}>}
 */
export const getLikeHydraIdOwnedByTheCurrentUser = (resource, hydraId, userName) => (
  dataProvider({
    type: GET_MANY_REFERENCE,
    resource,
    params: {
      pagination: false,
      filter: {
        target: hydraId,
        'owner.username': userName,
      },
    },
  })
  // запрашивали массив, а нужно вернуть HydraId
    .then(({ data, ...rest }) => {
      let likeHydraId = null;
      if (Array.isArray(data) && data.length >= 1) {
        likeHydraId = data[0]['@id'];
      }
      return Promise.resolve({ data: likeHydraId, ...rest });
    })
);
