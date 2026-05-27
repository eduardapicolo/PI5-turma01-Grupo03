const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

// configura o login do google usando passport
// esse arquivo e uma alternativa de login por estrategia google oauth
passport.use(
  new GoogleStrategy(
    {
      // dados do google ficam nas variaveis de ambiente
      clientID:     process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:  process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // tenta encontrar um usuario pelo id do google
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          // se encontrou, login finaliza com esse usuario
          return done(null, user);
        }

        // se nao encontrou pelo google id, tenta encontrar pelo email
        // isso ajuda quando a conta ja existia antes do google id ser salvo
        const email = profile.emails?.[0]?.value;
        user = await User.findOne({ email });

        if (user) {
          // vincula o google id ao usuario que ja existia
          user.googleId = profile.id;
          if (!user.avatar && profile.photos?.[0]?.value) {
            user.avatar = profile.photos[0].value;
          }
          await user.save();
          return done(null, user);
        }

        // se nao existe usuario, cria uma conta nova como adotante
        user = await User.create({
          googleId: profile.id,
          email,
          name:   profile.displayName,
          avatar: profile.photos?.[0]?.value || null,
          role:   'user',
        });

        return done(null, user);
      } catch (err) {
        // se der erro no login, o passport recebe o erro
        return done(err, null);
      }
    }
  )
);

// guarda apenas o id do usuario na sessao do passport
passport.serializeUser((user, done) => done(null, user.id));

// usa o id salvo para buscar o usuario completo no banco
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// exporta o passport configurado
module.exports = passport;
