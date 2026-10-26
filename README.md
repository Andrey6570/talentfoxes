# Talent Foxes

Приложение для детей: двигайся, наводи порядок в комнате и расти питомца. У родителей есть кабинет с заданиями и баллами.

- Родители входят через Google (до двух на семью).
- Каждый ребёнок входит по своему логину и паролю. У каждого свои задания, награды, питомец и плейлисты.
- Русский и английский, цвет темы выбирает ребёнок.
- Данные хранятся в Firebase (Authentication и Firestore).

## Как это устроено

Веб-приложение на Vite и обычном JavaScript, упаковано в Android через Capacitor. APK собирает GitHub Actions
(`.github/workflows/android.yml`): откройте вкладку **Actions**, выберите последний запуск и скачайте артефакт `talent-foxes-apk`.

```
src/             интерфейс и логика
firestore.rules  правила доступа к базе
android/         проект Android (Capacitor)
```

## Первый запуск

1. Firebase Console → Firestore Database → **Rules**: вставьте содержимое `firestore.rules` и нажмите **Publish**.
2. Firebase Console → Project settings → Your apps → Android → **Add fingerprint**: вставьте SHA-1 ключа подписи (ниже),
   затем скачайте новый `google-services.json` и замените `android/app/google-services.json`.
3. Authentication → Sign-in method: включены Google и Email/Password.
4. GitHub → Settings → Secrets and variables → Actions: добавьте `KEYSTORE_BASE64` (ключ подписи, закодированный в base64)
   и `KEYSTORE_PASSWORD`.

Ключ подписи `talentfoxes.jks` в репозитории не хранится. Его SHA-1:

```
B7:B0:96:17:4C:AB:79:E8:83:70:6C:22:21:95:1C:B3:CC:49:92:13
```

## Как работает вход ребёнка

Firebase не умеет входить по логину, поэтому ребёнок входит по служебному адресу
`логин__кодсемьи@kid.talantfoxes.app`. Родитель создаёт ребёнка в кабинете: имя, логин латиницей, пароль от 6 символов.
Ребёнок вводит код семьи (он показан в кабинете родителя), логин и пароль. Код и логин запоминаются на устройстве.
Смена пароля создаёт новый служебный адрес, старый перестаёт работать.

## Данные в Firestore

```
invites/{код}                        fid
logins/{код__логин}                  fid, v (версия служебного адреса)
families/{fid}                       name, parentUids[], inviteCode
families/{fid}/kids/{kidId}          профиль, питомец, задания, награды, плейлисты, серия
families/{fid}/kids/{kidId}/log      отправленные и подтверждённые задания, бонусы
families/{fid}/kids/{kidId}/orders   покупки наград и одежды
```

Баланс звёзд считается из `log` и `orders`: подтверждённые задания и бонусы минус покупки.

## Разработка

```
npm install
npm run dev        # веб-версия в браузере
npm run sync       # собрать веб и обновить android/
```

Сборка APK локально требует Android SDK и JDK 21: `cd android && ./gradlew assembleRelease`.

## Известные ограничения

- Баланс считается на устройстве, поэтому технически ребёнок мог бы создать заказ без достаточного баланса.
  Родитель видит каждый заказ и может отказать с возвратом звёзд.
- Без секрета `KEYSTORE_BASE64` собирается отладочный APK с временным ключом, и вход через Google в нём работать не будет.
- Spotify и Яндекс Музыка подключены по ссылкам на плейлисты. Вход в Spotify добавим позже.
