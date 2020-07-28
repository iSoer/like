<template>
  <div
    v-if="!isLoading && !error"
    class="counter like"
  >
    <label
      :class="classesLabel"
      @change="toggle"
    >
      <input
        type="checkbox"
      >
      <i
        class="fa-heart"
        :class="{ 'fas': likeHydraIdOwnedByTheCurrentUser, 'far': !likeHydraIdOwnedByTheCurrentUser }"
      />

      <span
        v-if="total !== null"
        class="counter__count"
      >
        {{ total }}
      </span>
    </label>
  </div>
</template>

<script>
import jwtDecode from 'jwt-decode';
import { mapGetters } from 'vuex';
import {
  createLike as apiCreateLike,
  deleteLike as apiDeleteLike,
  getLikeHydraIdOwnedByTheCurrentUser as apiGetLikeHydraIdOwnedByTheCurrentUser,
  getLikes as apiGetLikes,
} from './api';

/**
 * @param token
 * @return {string|null}
 */
const getUserNameByToken = (token) => {
  try {
    const { username = null } = jwtDecode(token);
    if (username !== null && typeof username === 'string' && `${username}`.length > 0) {
      return username;
    }
    return null;
  } catch (e) {
    return null;
  }
};

export default {
  name: 'Like',

  props: {
    resource: {
      type: String,
      required: true,
    },

    targetHydraId: {
      type: String,
      required: true,
    },

    isDisabled: {
      type: Boolean,
      default: false,
    },
  },

  data() {
    return {
      isLoading: true,
      isUpdating: false,
      error: null,
      total: null,
      likeHydraIdOwnedByTheCurrentUser: null,
      isCurrentUserNameNoFount: false,
    };
  },

  computed: {
    ...mapGetters({
      token: 'app/auth/token',
    }),

    isLocked() {
      return this.isDisabled || this.isUpdating || this.isCurrentUserNameNoFount;
    },

    classesLabel() {
      return {
        disabled: this.isLocked,
        active: this.likeHydraIdOwnedByTheCurrentUser,
      };
    },
  },

  methods: {
    /**
     * @return {Promise<void>}
     */
    loadTotal() {
      return apiGetLikes(this.resource, this.targetHydraId)
        .then(({ total }) => {
          this.total = total;
        })
        .catch((e) => {
          this.error = 'Не удалось загрузить общее кол-во лайков';
          throw e;
        });
    },

    /**
     * @return {Promise<{}|{data: *}>}
     */
    loadLikeHydraIdOwnedByTheCurrentUser() {
      const userName = getUserNameByToken(`${this.token}`);

      if (!userName) {
        this.likeHydraIdOwnedByTheCurrentUser = null;
        this.isCurrentUserNameNoFount = true;

        return Promise.resolve({ data: null });
      }

      return apiGetLikeHydraIdOwnedByTheCurrentUser(this.resource, this.targetHydraId, userName)
        .then(({ data: likeHydraId, ...rest }) => {
          this.likeHydraIdOwnedByTheCurrentUser = likeHydraId;
          return { data: likeHydraId, ...rest };
        })
        .catch((e) => {
          this.error = 'Не удалось загрузить информацию о лайке текущего пользователя';
          throw e;
        });
    },

    /**
     * Параллельная загрузка кол-ва лайков и ставил ли текущий пользователь лайк
     
     * @return {Promise<void>}
     */
    async loadData() {
      this.isLoading = true;

      try {
        await Promise.all([
          this.loadLikeHydraIdOwnedByTheCurrentUser(),
          this.loadTotal(),
        ]);
      } catch (e) {
        // ничего не делаем, всё что нам нужно обрабатывается внутри промисов
      }

      this.isLoading = false;
    },

    /**
     * @return {Promise<void>}
     */
    async asyncCreate() {
      try {
        const { data } = await apiCreateLike(this.resource, this.targetHydraId);
        this.likeHydraIdOwnedByTheCurrentUser = data['@id'];
      } catch (e) {
        this.error = 'Не уалось поставить лайк';
      }
    },

    /**
     * @return {Promise<void>}
     */
    async asyncDelete() {
      try {
        await apiDeleteLike(this.likeHydraIdOwnedByTheCurrentUser);
        this.likeHydraIdOwnedByTheCurrentUser = null;
      } catch (e) {
        this.error = 'Не уалось далить лайк';
      }
    },

    /**
     * @return {Promise<void>}
     */
    async toggle() {
      if (this.isLocked || this.error) {
        return;
      }

      this.isUpdating = true;

      if (this.likeHydraIdOwnedByTheCurrentUser === null) {
        await this.asyncCreate();
      } else {
        await this.asyncDelete();
      }

      if (!this.error) {
        await this.loadTotal();
      }

      this.isUpdating = false;
    },
  },

  created() {
    this.loadData();
  },
};
</script>
