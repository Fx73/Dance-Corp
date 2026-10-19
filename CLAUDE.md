# CLAUDE.md

## Suivi des modifications et des problèmes

Ces deux documents sont rédigés en anglais. Mets-les à jour dans le même commit que la modification concernée, et préviens l'utilisateur à la fin de ta réponse quand tu les as modifiés.

### [Documentation/TO_VERIFY.md](Documentation/TO_VERIFY.md) : tests à faire

À chaque modification qui peut avoir un impact à l'exécution et que tu n'as pas pu tester (comportement, affichage, données, intégrations externes…), ajoute une entrée :

- ce qui a changé, avec le fichier ou le composant concerné et le hash du commit si disponible ;
- comment le vérifier : la page ou l'action à faire, et le résultat attendu.

Range l'entrée dans la section qui correspond, ou crée une section. Distingue les bugs corrigés volontairement (comportement modifié) des changements censés être sans effet. Ce fichier ne contient que des vérifications à faire.

### [Documentation/KNOWN_ISSUES.md](Documentation/KNOWN_ISSUES.md) : problèmes connus

Quand tu repères un bug sans le corriger, une dépréciation à migrer ou un point de maintenance en attente, ajoute-le ici avec sa cause et, si possible, une piste de correction. Quand un point est corrigé, retire-le de ce fichier (et ajoute dans TO_VERIFY.md ce qu'il faut tester si la correction n'a pas pu l'être).
