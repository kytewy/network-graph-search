# Complete Collection of Canadian AI Governance Documents
# This script contains all Canadian documents processed

# Document 1: OSFI Guideline E-23 - Model Risk Management (2027)
osfi_content = """Guideline E-23 – Model Risk Management (2027)
Information
Table of contents
A. Overview
The financial services industry is experiencing a rapid rise in digitalization and model applications amplified by the surge in artificial intelligence / machine learning (AI / ML) models. Institutions are increasingly relying on models to support or drive decision-making including in business areas that traditionally did not rely on models. Models now use more diverse data sources and complex techniques that heighten different aspects of model risk. Increased model risks could expose institutions to financial loss from flawed decision making, operational losses, legal implications, or reputation damage. Furthermore, models based on rapidly progressing technologies, like AI, can exacerbate these risks and others. Models characterized by dynamic self-learning and autonomous decision-making may become prevalent.
Institutions should be cognizant of how the use of models in their business can impact their risk profile and should have effective risk management practices to mitigate the risks. Model risk management should be conducted with integrity, at all times, particularly in a world where newer use cases, including those powered by AI, play a greater role in day-to-day operations.
A.1 Purpose
This principles-based guideline sets out our expectations for effective enterprise-wide model risk management (MRM) using a risk-based approach.
A.2 Scope
This guideline applies to all federally regulated financial institutions, including foreign bank branches and foreign insurance company branches, to the extent it is consistent with applicable requirements and legal obligations related to their business in Canada as set out in Guideline E-4 on Foreign Entities Operating in Canada on a Branch Basis.
A.3 Application
This guideline applies on a risk-basis, proportional to the institution's:
- size
- strategy
- risk profile
- nature, scope, and complexity of operations
- interconnectedness, such that disruptions could harm other financial institutions, the financial system, or the broader economy
A.4 Key Terms
Model
An application of theoretical, empirical, judgmental assumptions or statistical techniques, including AI/ML methods, which processes input data to generate results. A model has three distinct components:
- data input component that may also include relevant assumptions,
- processing component that identifies relationships between inputs, and
- result component that presents outputs in a format that is useful and meaningful to business lines and control functions.
Model risk
Model risk involves the risk of adverse financial impact (for example, inadequate capital, financial losses, inadequate liquidity, operational, or reputational consequences) arising from the design, development, deployment, and/or use of a model. This is the inherent risk of using a model and refers to the fundamental characteristics of the model and materiality to the institution. That is, the potential impact on the risk categories described in our Supervisory Framework.
Residual model risk
Residual model risk for the purpose of this guideline refers to the risk that remains after institutions have implemented controls, validation processes, monitoring, and other risk-mitigating measures. Thus, residual model risk captures the portion of risk that continues to exist despite institutions' best efforts to identify, measure, and mitigate model risk.
Note: From here onwards, model risk refers to inherent model risk unless otherwise stated.
Model Risk Rating
A categorical model risk tier associated with the inherent level of model risk based on quantitative and qualitative criteria reflecting intrinsic model vulnerabilities and materiality of model impacts from usage.
Model Lifecycle
The components that define the life of a model. It encompasses all steps for designing, operating, and maintaining a model until it is decommissioned. Model lifecycle components are model design (including model rationale, data, and development), model review, model deployment, model monitoring, and model decommission. These components are not necessarily sequential and may vary according to the type of the model, organisational structure, and use case.
Model Risk Management (MRM) Framework
A set of policies and procedures, that reflects the institution's risk appetite for model risk and defines the governance requirements to manage model risk. It includes roles and responsibilities as well as defined processes to identify, assess, manage, monitor, and report on model risk, both at an enterprise level and throughout the model lifecycle.
Model Inventory
An institution's system of record for storing key information related to models and serving as a basis for reporting. It contains all models whose inherent risk is determined to be non-negligible to the institution.
Model Owner
The unit(s) or individual(s) responsible for coordinating model development, implementation and deployment, ongoing monitoring and maintaining the model's administration, such as its documentation and reporting. The model owner may also be the model developer or user.
Model Developer
The unit(s) or individual(s) responsible for designing, developing, evaluating, and documenting a model's methodology.
Model Reviewer
The unit(s) or individual(s) responsible for reviewing the model's conceptual soundness, inputs, methodology, assumptions, and performance. Other responsibilities might include providing the model developer and user with guidance on the appropriateness of models for defined purposes and assessing model monitoring results as a part of periodic or ongoing validation.
Model Approver
The unit(s) or individual(s) or committee(s) with the authority to approve the use of a model within the institution, typically after considering the findings reported by the model reviewer and other governance requirements. This role is often part of a higher-level governance body (for example, a Model Risk Committee or senior management function) that ensures each model aligns with the institution's risk appetite and strategic objectives.
Model User
The unit(s) or individual(s) that rely on the model's outputs to inform business decisions.
Model Stakeholder
The unit(s) or individual(s) that are involved in the model lifecycle, use and governance of the model (for example, all parties defined above, legal team, compliance function).
A.5 Outcomes and expectations
The following are the expected outcomes of effective MRM:
- Model risk is well understood and managed across the enterprise.
- Model risk is managed using a risk-based approach.
- Model governance covers the entire model lifecycle.
B. Enterprise-wide model risk management
Outcome 1: Model risk is well understood and managed across the enterprise.
Institutions recognize model risk is transverse in nature, and senior management holds an enterprise-wide view of the risks. Model stakeholders are aware of a given model's intended use, inherent limitations, and potential negative outcomes to their business. There is adequate governance to manage and control model risk. Institutions are accountable for their use of models.
B.1 Organizational enablement
Principle 1.1: Effective reporting structures and proper resourcing should enable sound model governance.
Consistent with our Corporate Governance Guideline, senior management is responsible for:
- defining and applying the roles, accountabilities, and expectations for effective MRM across the enterprise,
- ensuring appropriate MRM personnel are in place with the requisite skills and experience, particularly for novel technologies, like AI,
- ensuring appropriate communication and reporting of model risk to the board of directors.
MRM should involve a multi-disciplinary team representing a wide range of expertise and functions from across the organization, including legal or ethics professionals as appropriate. This comprehensive approach is particularly critical as institutions adopt advanced technologies like AI/ML, which can significantly increase model complexity and potential impact.
Appropriate resources should be allocated to MRM and those resources should be allocated optimally towards managing the identified risks. Institutions should be able to provide evidence that they are structured and resourced to support a sound governance framework.
B.2 Model risk management framework
Principle 1.2: The MRM framework should align risk-taking activities to strategic objectives and risk appetite.
Institutions should establish an MRM framework that:
- fits into an institution's broader risk and governance framework as outlined in our Corporate Governance Guideline,
- reflects the institution's risk appetite for model risk,
- defines the processes and requirements to identify, assess, manage, monitor, and report on model risk,
- has clear guidelines for the major components of their MRM framework such as: model identification, model inventory, model risk ratings, and requirements for model lifecycle governance,
- defines how an institution provides transparent and consistent reporting of model risk at different levels of the enterprise,
- is subject to periodic review, especially as new technologies emerge, and
- covers models or data sourced from external sources like foreign offices or third-party vendors (pursuant to our Guideline B-10 Third-Party Risk Management Guideline).
B.3 Use of models
Principle 1.3: Models should be appropriate for their business purposes.
Institutions should deploy models only when they meaningfully contribute to decision-making, risk assessment or business purposes and deliver reliable outcomes consistent with their intended use. Effective MRM aids institutions by supporting the safe adoption and use of models to advance business goals.
Developing, deploying and using a model depends on having a clear purpose along with adequate data, systems, and technology. These elements should, therefore, be part of any discussion on model risk.
As organizational needs evolve, models that are no longer fit for purpose should be modified, replaced, or decommissioned.
C. Risk-based approach to model risk management
Outcome 2: Model risk is managed using a risk-based approach.
A risk-based approach is implemented and ensures MRM requirements are proportional to the level of model risk identified by the institution. A risk-based MRM framework is documented and implemented in a way that enables consistency across functional and business units. Institutions identify sources of model risk, and ensure adequate resources are allocated to manage, mitigate, or accept those risks as appropriate. A model inventory keeps an active record of models with non-negligible risk and key information about those models, including model risk ratings. The model risk rating approach reflects all material dimensions of inherent model risk. Model governance and other elements of MRM is commensurate with the identified level of model risk.
C.1 Model identification
Principle 2.1: Institutions should identify and track all models in use or recently decommissioned.
Institutions should have defined processes to periodically identify models used throughout the enterprise, including vendor and third-party models. These processes should include:
- surveying the institution to identify new models and updating the status of existing ones.
- applying triaging, including identifying whether a model has non-negligible inherent model risk and should therefore be subject to model lifecycle governance requirements (Note: we recognize that not all identified models, as per the Key Terms section A.4 above, carry model risk. Hence, models that do not bear model risk, may not require full model lifecycle governance.),
- assigning a provisional rating for new models or updating an existing model's risk rating where it has materially changed in substance or usage.
- storing in the institution's model inventory all models deemed to carry non-negligible inherent model risk.
An institution's model inventory should be:
- a comprehensive inventory of models whose inherent risk is determined to be non-negligible to the institution.
- maintained at the enterprise level, storing key information related to models (see Appendix A) and serving as a basis for management and regulatory reporting.
- accurate, evergreen, and subject to robust controls.
- updated in a timely manner, including model modifications and changes in model use, risk rating, or performance status.
- inclusive of decommissioned models for a period the institution considers reasonable.
C.2 Model risk rating
Principle 2.2: Institutions should establish a model risk rating approach that assesses key dimensions of model risk.
A risk rating approach should be implemented based on inherent model risk, thereby reflecting model vulnerabilities and materiality of model impacts. This enables institutions to ensure that their most critical or complex models receive enhanced scrutiny, while less risky models are subject to fewer requirements.
The risk rating approach should be supported by clear, measurable criteria for each risk dimension and incorporate both quantitative and qualitative factors:
- Quantitative factors include the importance, size and growth of the portfolio that the model covers (as applicable), or potential operational, security or financial impacts.
- Qualitative factors include business use or purpose, model complexity or level of autonomy, reliability of data inputs, customer impacts, or regulatory risk.
Institutions may organize risk factors according to other risk dimensions relevant to the institution's context and practice (for example, "vulnerability and materiality" or "uncertainty and impact").
Each model should be assigned a model risk rating. Institutions should have defined processes to do this. The processes may include having a temporary risk rating that is confirmed in the model review or model approval stage of the model lifecycle. Model risk ratings should be regularly reviewed and updated as appropriate, including when a trigger event occurs (for example, a decrease in performance or a material change in the model's use, data, or infrastructure).
Institutions may include a risk rating category that implies a negligible level of inherent model risk and therefore exempts such models from the full model lifecycle governance requirements. There should be a robust process to approve and track such exemptions.
Externally developed models should be assessed for model risk ratings on a standalone basis.
Even a well-structured MRM framework cannot eliminate model risk: some elements of uncertainty or limitations will persist even after controls and mitigants are applied. We do not expect residual model risk to drive the primary governance and oversight of models. Visibility of both the inherent and residual model risk, however, provides a view of the extent of risk mitigation and is useful for reporting to senior management.
In cases where model risk falls outside the institution's risk appetite, the institution should establish appropriate remediation actions.
C.3 Risk management intensity
Principle 2.3: The scope, scale, and intensity of MRM should be commensurate with the risk introduced by the model.
The institution's MRM framework should establish the scope, scale, and intensity of model governance requirements through the model lifecycle based on the inherent model risk rating.
The inherent model risk rating should drive the:
- frequency, intensity, and scope of model review.
- documentation requirements.
- level of authority required to approve the model, and any exemptions as needed.
- frequency, intensity, and scope of model monitoring.
- interval at which the risk rating is re-assessed.
The model risk rating should also, with information from the model review assessment, and depending on the risk appetite, determine the:
- limits or constraints on model usage (for example, limiting the model's scope, implementing additional safeguards, or even pursuing a different modeling approach)
- intensity of monitoring approach (for example, higher-risk models with limitations may require increased scrutiny in monitoring)
- controls and mitigants used to manage residual model risk (for example, allocating capital reserves to cover potential losses, enhancing model's conservatism, and contingency planning)
Unique MRM requirements may also be applied using other criteria (for example, by model type) but these should be in addition to the primary risk-based requirements. Institutions should further ensure their MRM capabilities are appropriate relative to overall complexity levels. For example, the extensive use of advanced AI/ML techniques should have correspondingly mature governance and oversight.
D. Model lifecycle management
Outcome 3: Model governance covers the entire model lifecycle.
Institutions manage risks arising from each component of the model lifecycle. Depending on the business case and the nature of the model, the overall model lifecycle may vary. Components include design—which encompasses model rationale, data acquisition, and model development—, review, deployment, and monitoring. Organizations have robust and reliable processes, procedures, and controls implemented throughout the model lifecycle.
D.1 Policies, procedures, and controls
Principle 3.1: MRM policies, procedures, and controls should be robust, flexible, and lead to effective requirements applied across the model lifecycle.
An institution's policies, procedures and controls, covering the full model lifecycle, are crucial components of the MRM framework. They should:
- apply to all models commensurate with the risk,
- ensure governance structures and practices remain sound and consistent across the enterprise,
- define explicit responsibilities and accountability for model stakeholders (for example, owners, reviewers, and users),
- identify and involve key stakeholders—such as data science teams, business units, compliance, ethics and legal teams, information technology, and risk management—early in the model lifecycle process,
- ensure appropriate independence and objectivity are maintained,
- be sufficiently flexible to accommodate evolving technologies, different model types (especially crucial given the "black box" and autonomous nature of many AI/ML models), varying levels of model risk, and organizational changes,
- be comprehensively and thoroughly documented.
D.2 Components of the model lifecycle
Model design
Model design encompasses:
- establishing clear organizational rationale for a model.
- adhering to standards that ensure data quality and accuracy.
- following appropriate model development processes.
Model rationale
Model owners should establish a clear rationale for deploying a new model or modifying an existing model. This involves:
- articulating a well-defined purpose—including the model's scope, coverage, and how its outputs are to be used (for model modifications, the rationale should explain the need for such changes).
- identifying the specific business use case and assessing the risk of the model's intended usage.
When establishing a rationale for models using advanced techniques, like AI/ML, model owners should consider several additional factors that stem from the nature of these models. These can include the:
- level of transparency and explainability required.
- need for alternative controls, especially for "black box approaches" or autonomous models.
- potential for the model to lead to biased outcomes, negative social and ethical implications, or privacy risks.
Model data
Principle 3.2: Data used to develop the model should be suitable for the intended use.
Data can vary in terms of sources, formats, and types. It may be structured, semi-structured or unstructured. It can also be synthetically generated or derived from proxy sources. The consequences of flawed data (for example, due to inaccuracies, bias, or missing records) is significant. This is especially crucial for AI/ML models, since they can easily mirror unwarranted data relationships and preserve them in the outputs.
Institutions should adopt robust data governance with standards for collecting, storing, and accessing data used in models. This should be integrated with enterprise-level data governance, strategy, and management. Data leveraged for model development should be:
- accurate and fit-for-use (that is, free from material errors with biases understood and managed).
- relevant and representative (that is, reflecting the intended target population of the model).
- compliant (that is, adhering to statutory, regulatory, and internal requirements for data ethics and customer privacy).
- traceable (that is, having documented lineage and provenance).
- timely (that is, updated at an appropriate frequency).
One important purpose of the above data properties is to enhance the explainability of the model and associated outputs. Consideration needs be given to the potential for unwanted bias within the data which can translate into unfair model outputs with associated reputational risks.
Institutions should also:
- regularly perform thorough data quality checks (for example, outlier detection, missing value analysis, and consistency evaluations).
- implement controls to ensure quality and document provenance and use of synthetic data and proxy data.
- have controls to ensure appropriate data cleansing operations (for example, handling of inaccurate and missing values).
Model development
Principle 3.3: Institutions should have model development processes that set clear standards for performance and documentation.
Model development involves selecting conceptually sound methodologies, data, and algorithms. In the case of AI/ML models, it also requires proper training and parameter optimization. Institutions should establish clear, consistent, and repeatable practices for developing models. These include:
- standards for model documentation, including elements such as:
- the set up and running of the model,
- limitations and restrictions on use,
- detailed descriptions of processes for creating, accessing, and maintaining the data used to develop the model,
- detailed descriptions of model assumptions and methodology,
- the role of expert judgment, including which experts are involved and how their input affects the model output,
- analyses and performance tests performed by the developers.
- guidelines for selecting conceptually sound methodologies, data (including the application of variable transformations), and algorithms.
- explainability requirements, which may vary based on the model's purpose, level of autonomy, regulatory requirements, or the potential impact on customers and stakeholders.
- performance and other criteria for model selection.
- standards on how the model outputs are used and reported.
- performance and other criteria for model monitoring.
Model review
Principle 3.4: Institutions should have a process to independently assess conceptual soundness and performance of models.
The model review process should be independent from model development. It should validate that models are properly specified, working as intended, and fit-for-purpose. Institutions can use the work of internal reviewers or objective third parties. The extent and frequency of model reviews should be commensurate with the model risk rating. Events that should prompt a model review include the following:
- development of new models,
- model modifications (including changes to algorithms, parameters, or supporting operational components),
- breaches of model performance (for example, when monitoring highlights material errors, drifts, or threshold violations),
- significant data changes (for example, new data sources, altered data definitions, or shifts in data quality),
- scheduled risk-based periodic reviews.
Model reviews may include:
- confirming or challenging the model risk rating.
- reviewing the model purpose, scope, conceptual soundness, limitations, mitigants, and reasonableness of model outcomes.
- reviewing data quality and appropriateness.
- reviewing novel methodologies, algorithms, tools, and procedures for example, for AI/ML models.
- evaluating the level of explainability for the model workings as per the intended use of the model, including AI/ML models (This includes confirming that model outputs are appropriately explainable and comply with performance expectations).
- reviewing third-party models and platforms or sub-components (including data and libraries) used for model development.
- documenting review assessments and actions taken in response.
- reporting the outcome of the review, including an assessment detailing any findings and recommendations, along with an overall recommendation on approval to the model approver.
Model approval
Model approval processes should occur throughout the model lifecycle. The model approval decision typically involves two components:
- Assessing whether the model is suitable to be implemented into production (or continue to be used) based on its intended use.
- Affirming the assigned model risk rating and residual risk assessment.
The model may be approved despite identified weaknesses or limitations provided that compensating mitigants are in place, or the model stakeholder group provides justification for using a model with known limitations or weaknesses.
Model deployment
Principle 3.5: Models should be deployed in an environment with quality and change control processes.
Model deployment requires careful coordination to ensure the model is properly configured, tested, and moved into production. Integrating models into operational settings should preserve their integrity and reliability. This is particularly important for AI/ML models that may depend on multiple components, diverse and dynamic data sources, and third-party elements.
Effective model deployment should involve the following, as applicable:
- collaboration among model developers, model owners, model reviewers, model users, and technology or operations teams,
- consistency between data used to develop the model and the production dataset,
- tests demonstrating that the model operates as expected in the production environment,
- clearly documented procedures that outline deployment steps, stakeholder responsibilities, approval hierarchies, change control, monitoring frameworks and exception handling including overlays,
- performance of risk assessments for related risks prior to deployment such as cybersecurity risk, infrastructure vulnerabilities, and other potential operational risks (see OSFI Guidelines B-13 and E-21),
- review of explainability requirements and communication of explanatory outputs to the appropriate stakeholders.
Model monitoring
Principle 3.6: Institutions should have defined standards for model monitoring, and model decommission.
Model monitoring ensures models remain fit-for-purpose and aims to detect performance issues or breaches. This may be particularly challenging for complex AI/ML models, where scalability, performance, and monitoring for model drift are critical. Model monitoring should document and include:
- monitoring standards covering frequency, scope, and evaluation criteria as applied to different risk rating levels and model types,
- evaluating criteria that include both quantitative measures (for example, performance metrics) and qualitative assessments (for example, verifying the model is within its original scope),
- tracking and evaluating operational factors such as changes in: model performance, model usage, input data, external dependencies (for example, version updates), or the characteristics of what is being modelled (for example, added product features),
- defining thresholds for breaches and criteria for material model modifications, including changes in operational factors,
- determining contingency plans for model unavailability, deterioration in model performance, or outright failure along with the escalation procedures for addressing these,
- implementing processes for handling AI/ML's unique challenges, such as autonomous decision making, autonomous re-parametrization, and the elevated potential for model drift,
- ensuring issues are shared promptly with relevant stakeholders, following appropriate escalation procedures.
Model decommission
Model decommission is the formal retirement of a model from active use. Reasons to decommission may include:
- performance issues (for example, a severe performance failure, repeated monitoring breaches, excessive overrides),
- business, regulatory, or strategic changes,
- obsolete data, methodology, or cost–benefit considerations.
Decommissioning should follow a disciplined process and include:
- Alerting all relevant stakeholders of the planned decommission.
- Retaining the retired model and documentation for a set period as a benchmark or fallback.
- Determining what additional actions are needed for decommissions of any third-party models.
- Monitoring downstream effects to ensure no residual impacts.
Appendix 1: Information tracking for models
At a minimum, institutions should maintain the following for each identified model:
- model ID
- model name and description of key features and use
- model risk rating
- model owner
- model developer
- model origin (for example, internally developed or vendor).
In addition, for models deemed to have non-negligible risk and hence stored in the model inventory, institutions should also maintain:
- model version
- date of model's deployment into production
- model reviewer
- model approver
- model dependencies
- data sources and description
- approved uses of the model
- model limitation(s) (including exceptions and additional requirements)
- date of model's most recent model review
- monitoring status (with exceptions as applicable)
- next review date."""

# Document 2: DAIS Submission on Proposed AIDA
dais_content = """Contributors
The Dais at the Toronto Metropolitan University
The Centre for Media, Technology and Democracy at McGill University

This submission to the Standing Committee on Industry and Technology (INDU) highlights areas of concern and recommendations to make Canada's proposed Artificial Intelligence and Data Act (AIDA) fit to purpose to responsibly govern AI and its risks. In October 2023, the Dais and the Centre for Media, Technology, and Democracy convened a roundtable with 30 participants from academia, civil society, and industry to address concerns about the proposed AIDA.

The issue: The AIDA's requirement that the ISED Minister appoint an Artificial Intelligence and Data Commissioner creates issues of regulatory independence, including a severe lack of accountability in oversight. Proposed amendment: Establish the AI and Data Commissioner as independent from the Minister, ideally through a parliamentary appointment, with sufficient resources and processes to support their function. In October 2023, the Dais and the Centre for Media Technology and Democracy organized a one-day joint multi-stakeholder roundtable discussion with over 30 participants from academia, civil society organizations, and industry. Our goal was to build on our previous analysis of the proposed AI and Data Act (AIDA) by inviting experts to respond to and engage with our proposed recommendations. Discussions from the roundtable have informed the contents of this submission.

Furthermore, akin to the EU AI Act's ban on systems that pause unacceptable risk, we propose that the AIDA include explicit prohibitions on the design, development, and use of systems that cause unacceptable risks to individuals and communities. This may include developing factors that help identify systems that "exploit vulnerable groups based on their age (such as children) or physical and mental disabilities, as well as systems that are used by public authorities for social scoring purposes that lead to detrimental or unfavourable treatment that is unjustified." This would strengthen the AIDA's purpose "to prohibit certain conduct in relation to artificial intelligence systems that may result in serious harm to individuals or harm to their interests". 

Key issues identified:
· The AIDA does not apply to public institutions.  
· Public sector use of AI requires legislation.

The AIDA proposes to establish an Artificial Intelligence and Data Commissioner to assist the Minister with administration and enforcement powers. This senior public servant role is designated by the Minister. ISED has defended this approach citing AI as a rapidly evolving area requiring policy development and administration to work in close collaboration. However, the Commissioner's powers are afforded to them directly by the ISED Minister, who has competing roles of both championing the economic benefits of AI while regulating its risks. This can translate to challenges with the Commissioner being critical in their policy interventions, responding instead to the needs and interests of the Minister.

The varied perspectives of roundtable participants greatly informed this submission. Agreeing to be listed as a participant is not an endorsement of the contents of this report. The statements and recommendations are the sole responsibility of the Dais and the Centre for Media, Technology and Democracy.

Key Recommendations:

1. Regulatory Independence: Establish the AI and Data Commissioner as independent from the Minister, ideally through a parliamentary appointment, with sufficient resources and processes to support their function.

2. Explicit Prohibitions: Include explicit prohibitions on the design, development, and use of systems that cause unacceptable risks to individuals and communities, similar to the EU AI Act's approach.

3. Vulnerable Groups Protection: Develop factors that help identify systems that exploit vulnerable groups based on their age (such as children) or physical and mental disabilities.

4. Public Sector Coverage: Address the gap that the AIDA does not apply to public institutions and ensure public sector use of AI is properly regulated.

5. Accountability Mechanisms: Strengthen oversight and accountability mechanisms to ensure the Commissioner can be critical in their policy interventions without being constrained by ministerial interests.

The submission emphasizes that Canada's proposed AIDA needs significant amendments to be fit for purpose in responsibly governing AI and its risks, drawing on multi-stakeholder input from academia, civil society, and industry experts."""

# Document 3: Montreal Ethics AI - Death of AIDA Analysis
montreal_ethics_content = """✍️ Op-Ed by Blair Attard-Frost, a PhD Candidate at the University of Toronto. She researches and teaches about the governance of AI systems in Canada and globally.

Summary
Canada is currently experiencing a historic bout of political turbulence, and the proposed Artificial Intelligence and Data Act (AIDA) has died amidst a prorogation of Parliament.

The AIDA was tabled in Canada's House of Commons in June 2022 with the ambitious goal of establishing a comprehensive regulatory framework for AI systems across Canada. However, the AIDA was embroiled in controversy throughout its life in Parliament. A chorus of individuals and organizations voiced concern with the AIDA, citing its exclusionary public consultation process, its vague scope and requirements, and its lack of independent regulatory oversight as reasons why the legislation should not become law. Though the government ultimately proposed some amendments to the AIDA in response to criticisms, the amendments did not sufficiently address the fundamental flaws in the AIDA's drafting and development. As a result, the AIDA languished and died in a parliamentary committee, unable to secure the confidence and political will needed to proceed through the legislative process.

The AIDA will be remembered by many as a national AI legislation failure, and in its absence, the future of Canadian AI regulation is now uncertain. A victory for the Conservative Party of Canada in an upcoming federal election seems likely. A Conservative approach to AI regulation may favor promoting AI innovation and targeted intervention in specific high-risk AI use cases over the more comprehensive, cross-sectoral framework of the AIDA. In the absence of clear and effective national AI regulation, Canadians can still regulate AI systems at smaller scales. Professional associations, unions, and community organizations in Canada and elsewhere have already created policies, guidelines, and best practices for regulating AI systems in workplaces and communities. As Canada's political upheaval continues and new regulatory norms for AI emerge, these bottom-up approaches to AI regulation will play an important role.

Introduction
With Canadian Parliament prorogued and a non-confidence vote and federal election looming over the country, Canada's proposed Artificial Intelligence and Data Act has died on the table of a House of Commons committee.

The Artificial Intelligence and Data Act (or "AIDA" for short) will be remembered by many as an ineffective and undemocratic piece of legislation. Though the AIDA aimed to set comprehensive rules on AI systems across Canada to protect against harmful uses of AI, the legislation was widely criticized for its exclusionary public consultation process, narrow scope, lack of specificity, and lack of independent regulatory enforcement and oversight.

Early Life of the AIDA
The AIDA was tabled in Parliament in June 2022 as part of Bill C-27, a package of three new legislative acts collectively known as the Digital Charter Implementation Act. The first two acts bundled together in Bill C-27 – the Consumer Privacy Protection Act and the Personal Information and Data Protection Tribunal Act – aimed to modernize Canada's consumer data protection and privacy laws. As the third act in Bill C-27, the AIDA aimed to establish a regulatory framework for the development, deployment, and operation of AI systems, to be enforced by a new government official known as the "AI and Data Commissioner."

The regulatory framework set out by the AIDA required developers, providers, and operators of "high-impact" AI systems in Canada to comply with requirements for risk assessment and mitigation, recordkeeping, and disclosure of key system information or face monetary penalties and criminal offences. Unfortunately, the text of these requirements, as written in the AIDA, was deemed unfit for this purpose by many critics of the legislation.

Criticisms & Controversies
During its life in Parliament, the AIDA was hotly debated over the course of two readings by Members of Parliament, as well as in an in-depth study by the House of Commons Standing Committee on Industry and Technology (INDU). The INDU Committee's study of the AIDA began in April 2023 and has now been left incomplete.

During the INDU committee's study of the AIDA, a total of 137 witnesses appeared before the committee to comment on the AIDA; 113 briefs were also submitted to the committee by a range of individuals and organizations. Many of those submissions expressed concern that the requirements for developers and operators of high-impact systems set out by the AIDA were vaguely described and insufficient for protecting Canada against harmful AI impacts. This insufficiency was due in large part to the AIDA's lack of robust and inclusive stakeholder engagement. Instead of an open and public process of consultation and deliberation, records provided by the government show that the development of the AIDA primarily occurred behind closed doors with a selective group of industry representatives.

Sectors and workers vulnerable to the impacts of AI systems, marginalized communities, and civil society organizations were largely excluded from participating in the drafting and development of the AIDA. As a result, the AIDA did not adequately serve the interests of many stakeholders. For example, in their submission to the INDU committee, the Canadian Labour Congress deemed the AIDA insufficient for protecting Canadian workers against harmful AI systems, recommending that the legislation be "reconceived from a human, labour, and privacy rights-based perspective, placing transparency, accountability and consultation at the core of the approach to regulating AI."

Submissions by labour organizations representing creative workers voiced similar concerns, such as the Directors Guild of Canada and Writers Guild of Canada, Screen Composers Guild of Canada, Music Canada, and a group of advocacy organizations representing Canadian authors and publishers. These organizations deemed the AIDA ineffective at protecting artists and creative workers against the social and economic impacts of generative AI.

In addition, briefs submitted by Amnesty International and the Women's Legal Education and Action Fund observed that the AIDA did not provide sufficient protections for human rights, particularly for the rights of racialized communities, women, and gender minorities. The Assembly of First Nations stated that a lawsuit against the government was likely due to the government's failure to uphold Indigenous rights by consulting First Nations during the AIDA's drafting. In their submission, the Assembly of First Nations noted that "AI has the potential to destroy First Nations' cultures, threaten First Nations' security, and increase demand for our resources." Over the course of the INDU committee's study, submissions such as these made it strikingly clear that the AIDA was not designed to protect those in greatest need of protection against AI.

Later Life & Death
In response to criticisms of the AIDA, the government proposed a series of amendments to the legislation in November 2023. The proposed amendments added specificity to the scope, requirements, and regulatory powers set out by the legislation, but were not substantive enough to address the concerns of the legislation's critics and move the AIDA into law. As the Canadian Union of Public Employees (CUPE) wrote in their brief to the INDU committee following the proposal of the amendments:

"The Committee should allow sufficient time for stakeholders to analyze and provide additional commentary on these new amendments. Still, what is before the committee is a deeply flawed legislative framework on a pivotal matter for all Canadians."

The proposed amendments to the AIDA were too little too late. After languishing on the table of the INDU committee throughout 2024, the AIDA, along with the rest of Bill C-27, ultimately failed to become law. The AIDA's failure can be attributed to several factors, including its unclear and incomplete scope and requirements, limited public participation in the drafting of the legislation, and a now-imploding government that neglected to take greater accountability for these errors. In a strange twist of fate, the legislation intended to bolster trust and accountability in AI systems was unable to overcome a lack of trust and accountability in its own legislative process.

AI Regulation in a Post-AIDA Canada
AI regulation now faces an uncertain future in Canada. With the Conservative Party of Canada likely to form a new government following an upcoming non-confidence vote and federal election, Canada's AI policy landscape may see significant changes in the coming months and years.

Although the Conservative Party has not released a definitive official statement of their intended approach to regulating AI, remarks on innovation policy and AI regulation by Conservative MPs such as Rick Perkins and Michelle Rempel Garner indicate that the Conservatives may take a lighter-handed approach to AI regulation than the current government. In contrast to the sweeping, cross-sectoral approach of the AIDA, Conservative AI policy may focus primarily on promoting AI innovation in pursuit of economic growth, leveraging existing laws or creating new legislation only for addressing specific high-risk uses of AI that are of particular concern to the government. In the United States, a similar approach to prioritizing AI innovation over regulation is also likely under the new Trump administration, potentially adding further deregulatory pressure to a Conservative Canadian government.

Regardless of the regulatory approach that Canada's next government may take, it is important to recognize that AI regulation can and does exist outside of government. Following the 2023 strikes of the Writers Guild of America (WGA) and Screen Actors Guild – American Federation of Television and Radio Artists (SAG-AFTRA), both unions established new regulations for the training of AI models on union-protected creative works and the use of generative AI applications in the workplace. In Canada, professional associations and unions such as the Canadian Bar Association, College of Physicians & Surgeons of Manitoba, and Elementary Teachers' Federation of Ontario have already created guidelines and rules for regulating how AI tools can be used within their professions and workplaces.

Canadians do not need to wait and hope for our next government to fill the regulatory vacuum left by the death of the AIDA. In the absence of clear and effective national AI regulation, we can organize with our co-workers and our communities to create smaller-scale policies, guidelines, and best practices for how AI should be built and used in the places that we live in and work. As Canada's political upheaval continues and new regulatory norms for AI emerge, these bottom-up approaches to AI regulation will play an important role.

If you are interested in taking AI regulation into your own hands, my essay on AI countergovernance, along with Partnership on AI's Guidelines for Participatory and Inclusive AI, NIST's AI Risk Management Framework Playbook, and TechTarget's guide to creating an acceptable use of AI policy for an organization, will provide useful resources for creating your own policies, guidelines, and shared rules for AI."""

# Document 4: KPMG Canada - Guideline E-23 Readiness Analysis
kpmg_content = """In September 2017, the Office of the Superintendent of Financial Institutions (OSFI) Guideline E-23 Enterprise-Wide Model Risk Management for Deposit-Taking Institutions came into effect. This guideline, which falls under the category of "Sound Business and Financial Practices", sets out OSFI's expectations regarding sound policies and practices related to enterprise-wide model risk management.

Fast forward to 2025 – the models used in financial services organizations continue to increase in complexity, relying on larger and more varied data sets as well as advanced analytics such as machine learning and artificial intelligence. Models are increasingly embedded into operations. As decision-makers place more reliance, directly or indirectly, on the outputs of models, there is a corresponding increase in model risk. In recognition of this, OSFI announced in May 2022 that it was seeking to revise Guideline E-23 to:
- Extend the guideline to other federally regulated financial institutions (FRFIs), including insurers
- Address emerging model risks
- Provide clarification on how the guideline should be applied

Based on feedback received during the May 2022 consultation period, an updated draft guideline was issued in November 2023. It is expected that final guidance will be published by September 2025, with an effective date of 1 year from publication.

Although insurers, reinsurers, and fraternals have not been subject to Guideline E-23 so far, use of models has long been embedded in the insurance industry. After all, the business of insurance requires quantifying the impact of uncertain future events, usually relying on the specialized modeling skills and professional judgement of actuaries. Consequently, all FRFIs conducting insurance business should already have a model risk management (MRM) framework in place. However, this does not mean that these institutions should be complacent about the implications of being included in the scope of Guideline E-23. Here are some things to consider:

What is a "model"?
The definition of models set out in Section 2 of Guideline E-23 is very wide. It is easy to identify "big" models, such as those that are used for actuarial purposes, including pricing, financial reporting, risk and capital management. However, the definition of a model under the current draft Guideline E-23 includes any tool that applies theoretical, empirical or statistical techniques and assumptions in processing data to generate results. Therefore, the entity would need to consider whether the current MRM framework has captured all tools which would potentially meet the OSFI definition. AI adoption has significant implications for the number of models as each of the separate use cases for an underlying AI model need to be captured and evaluated separately.

Once the universe of models in the organization has been identified, any model that could materially impact the risk profile of the entity should be within the scope of the MRM framework. This can include, for example, a spreadsheet tool that is used to perform so-called "out of model" adjustments to the output of the "big" actuarial models.

What about models that are used to support operations, such as a model used in making underwriting decisions; or to inform strategic direction, such as a spreadsheet that forecasts sales and revenue? A sound assessment of models in scope should at a minimum:
- Trace both upstream and downstream model dependencies, from external as well as management reporting
- Examine key processes and the tools that support them
- Assess how the models identified in a) and b) affect the organization's risk profile

It is expected that the volume of models that will need to be tracked will significantly increase, and insurers should consider the challenges of maintaining an up-to-date and comprehensive inventory across all the different model types and use cases.

How does the MRM framework compare with OSFI's preferred practices?
Sections 2 and 3 of the latest draft Guideline E-23 define certain roles within an MRM framework as well as OSFI's expected outcomes for FRFIs. The MRM framework needs to cover the entire model management cycle set out in Section 4. This includes model development, model change management, and model decommissioning. A model inventory that is kept up to date is critical to an effective MRM framework. Tracking models at various stages in the model management cycle can be a challenge. The challenge increases with the number of models to be tracked and the wider the range of model users and model owners. Some insurers are already investing in technology solutions that can not only help with inventory management but also help to manage the workflow associated with the associated risk management activities. Model change management places a lot of emphasis on vetting and validation activities – these can be very time and resource intensive, and extending the models that are now in scope can lead to capacity issues for organizations.

It is recommended that entities review their MRM framework against the structure set out by OSFI in Section 5. For example, it is not uncommon to see the role "model steward" which, at different entities, may be mapped to different E-23 role definitions, or even to a combination of roles. Another example is where the role of reviewer and approver may be combined under the current framework, whereas OSFI would prefer that they are separate. If they are combined, OSFI requires that there are mechanisms in place to ensure independence and conflicts of interest are managed. These measures would need to be addressed in the governance structure and corresponding documentation of the MRM framework.

Guideline E-23 currently makes a distinction between expectations for institutions using approved internal models for regulatory capital purposes vs. other "standardized institutions". There is an implicit assumption that this distinction will also capture "large and complex" vs. "smaller and simpler". However, given the forthcoming extension of Guideline E-23 to insurers and other FRFIs with different regulatory capital frameworks, the November 2023 draft guideline explicitly references the expectation that model risk management should be proportional to the organization's "model risk profile, complexity and size". Regardless, smaller insurers and fraternals are likely to struggle with operating their MRM framework and may need to consider outsourcing one or more of the components (for example, independent model validation).

Emerging risks
The pace of change for tools and approaches used by insurers to manage their business has picked up considerably since Guideline E-23 was first issued. Recent developments, such as IFRS 17 adoption, have also contributed to an environment where models are becoming increasingly complex and specialized. One example is the deployment of new stochastic models to meet IFRS 17 requirements related to measuring financial options and guarantees embedded within insurance products. As it may take time to build capability in new modeling skill sets, this can lead, at least in the short term, to increased reliance on third parties. The incorporation of advanced analytics, machine learning, artificial intelligence, and other complex processing techniques lead to results that are harder to validate and explain. As a result, a fresh look at how entities assess and manage model risk is needed. OSFI's task of incorporating these developments while applying proportionality in how entities of various sizes and complexities address similar risks is not to be understated.

How KPMG can help
The model risk management landscape continues to evolve and change for insurers. The finalization of the update to Guideline E-23, which is expected before year end, will extend applicability to insurers and set out OSFI's expectations of how model risk is managed within the organization. KPMG's advisory professionals can help insurance organizations with assessing their preparedness for compliance with the updated Guideline. Beyond compliance, we can advise on preferred practices that can drive better MRM outcomes, while managing the administrative burden. Our modeling and model risk professionals have the knowledge, skills and experience to help with components of the MRM framework using leading technologies. Organizations of all sizes should take this opportunity to revisit their MRM frameworks, approach, and model inventory so that they are well-positioned to address model risk as part of their overall risk management framework."""

# Create individual article dictionaries
osfi_article = {
    'title': "Guideline E-23 – Model Risk Management (2027)",
    'summary': "OSFI's comprehensive principles-based guideline for enterprise-wide model risk management in Canadian financial institutions, addressing the rapid rise of AI/ML models and establishing risk-based frameworks for the complete model lifecycle from design to decommission.", 
    'content': osfi_content
}

dais_article = {
    'title': "Submission on the Proposed Artificial Intelligence and Data Act",
    'summary': "Joint submission by DAIS (Toronto Metropolitan University) and Centre for Media, Technology and Democracy (McGill University) to Canada's Standing Committee on Industry and Technology, highlighting critical concerns about AIDA's regulatory independence, scope limitations, and enforcement mechanisms. Based on multi-stakeholder roundtable with 30+ participants from academia, civil society, and industry.", 
    'content': dais_content
}

montreal_ethics_article = {
    'title': "The Death of Canada's Artificial Intelligence and Data Act: What Happened, and What's Next for AI Regulation in Canada?",
    'summary': "Analysis by PhD candidate Blair Attard-Frost examining the failure of Canada's AIDA legislation due to exclusionary consultation processes, vague requirements, lack of independent oversight, and insufficient stakeholder engagement. Despite 137 witnesses and 113 briefs submitted to parliamentary committee, the bill died amid political turbulence, leaving Canada's AI regulatory future uncertain as Conservative government likely to take lighter regulatory approach.", 
    'content': montreal_ethics_content
}

kpmg_article = {
    'title': "Are you ready for Guideline E-23?",
    'summary': "KPMG Canada's practical guidance for financial institutions preparing for OSFI's expanded Guideline E-23 model risk management requirements. Analyzes the extension from banks to insurers, reinsurers, and fraternals, addressing challenges in model definition, inventory management, emerging AI/ML risks, and framework compliance. Emphasizes the dramatic increase in model volume requiring tracking and the need for proportional approaches based on organizational complexity.", 
    'content': kpmg_content
}

# Create the complete records collection
canadian_records = [
    {
        "_id": 'OSFI_1',
        "chunk_text": f"{osfi_article['title']}. {osfi_article.get('summary', '')}. {osfi_article['content']}",
        "category": "regulation",
        "label": osfi_article['title'],
        "summary": osfi_article['summary'],
        "content": osfi_article['content'],
        "continent": 'North America',
        "country": 'Canada',
        "sourceType": 'Government',
        "url": "https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/guideline-e-23-model-risk-management-2027"
    },
    {
        "_id": 'DAIS_1',
        "chunk_text": f"{dais_article['title']}. {dais_article.get('summary', '')}. {dais_article['content']}",
        "category": "analysis",
        "label": dais_article['title'],
        "summary": dais_article['summary'],
        "content": dais_article['content'],
        "continent": 'North America',
        "country": 'Canada',
        "sourceType": 'Academic',
        "url": "https://dais.ca/reports/submission-on-the-proposed-artificial-intelligence-and-data-act/"
    },
    {
        "_id": 'MAEI_1',
        "chunk_text": f"{montreal_ethics_article['title']}. {montreal_ethics_article.get('summary', '')}. {montreal_ethics_article['content']}",
        "category": "analysis",
        "label": montreal_ethics_article['title'],
        "summary": montreal_ethics_article['summary'],
        "content": montreal_ethics_article['content'],
        "continent": 'North America',
        "country": 'Canada',
        "sourceType": 'Academic',
        "url": "https://montrealethics.ai/the-death-of-canadas-artificial-intelligence-and-data-act-what-happened-and-whats-next-for-ai-regulation-in-canada/"
    },
    {
        "_id": 'KPMG_1',
        "chunk_text": f"{kpmg_article['title']}. {kpmg_article.get('summary', '')}. {kpmg_article['content']}",
        "category": "guide",
        "label": kpmg_article['title'],
        "summary": kpmg_article['summary'],
        "content": kpmg_article['content'],
        "continent": 'North America',
        "country": 'Canada',
        "sourceType": 'Consulting',
        "url": "https://kpmg.com/ca/en/home/insights/2025/08/are-you-ready-for-guideline-e23.html"
    }
]

# Import necessary functions for Pinecone upload
import os
import sys
import time
from typing import List, Dict, Any
from pinecone import Pinecone
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def validate_record(record: Dict[str, Any]) -> Dict[str, Any]:
    """Validate that a record has required fields."""
    if not record.get('_id') or not record.get('chunk_text'):
        raise ValueError('Record must have _id and chunk_text fields')
    return record

def create_pinecone_index(pc: Pinecone, index_name: str) -> None:
    """Create Pinecone index if it doesn't exist."""
    if not pc.has_index(index_name):
        print(f"Creating new index: {index_name}")
        
        pc.create_index_for_model(
            name=index_name,
            cloud="aws",
            region="us-east-1",
            embed={
                "model": "llama-text-embed-v2",
                "field_map": {"text": "chunk_text"}
            }
        )
        
        print("Waiting for index to be ready...")
        max_wait = 300  # 5 minutes max
        start_time = time.time()
        
        while time.time() - start_time < max_wait:
            try:
                index = pc.Index(index_name)
                stats = index.describe_index_stats()
                print(f"Index {index_name} is ready!")
                break
            except Exception:
                print("Index still initializing...")
                time.sleep(10)
        else:
            raise TimeoutError(f"Index {index_name} did not become ready within {max_wait} seconds")
    else:
        print(f"Index {index_name} already exists")

def upsert_records_to_pinecone(records: List[Dict[str, Any]]) -> None:
    """Upload records to Pinecone."""
    
    # Environment Configuration
    config = {
        'api_key': os.getenv("PINECONE_API_KEY"),
        'index_name': os.getenv("PINECONE_INDEX_NAME", "network-graph"),
        'namespace': os.getenv("PINECONE_NAMESPACE", "example-namespace"),
    }
    
    if not config['api_key']:
        raise ValueError("PINECONE_API_KEY environment variable not set")
    
    # Initialize Pinecone client
    pc = Pinecone(api_key=config['api_key'])
    
    # Create index if needed
    create_pinecone_index(pc, config['index_name'])
    
    # Target the index
    index = pc.Index(config['index_name'])
    
    if not records:
        print("No records to upload.")
        return
    
    # Log the size of each record
    import json
    for i, record in enumerate(records):
        record_size = len(json.dumps(record).encode('utf-8'))
        print(f"Record {i} (_id: {record['_id']}) size: {record_size} bytes")
        if record_size > 40960:
            print(f"WARNING: Record {i} exceeds Pinecone's 40KB limit by {record_size - 40960} bytes")
            # Print the size of each field to help identify what's taking up space
            for key, value in record.items():
                field_size = len(json.dumps(value).encode('utf-8'))
                print(f"  - Field '{key}' size: {field_size} bytes")
    
    print(f"Uploading {len(records)} records to Pinecone...")
    
    try:
        # Upsert records in batches (Pinecone limit: 96 records per batch)
        batch_size = 90  # Stay under the 96 limit
        total_records = len(records)
        
        for i in range(0, total_records, batch_size):
            batch = records[i:i + batch_size]
            batch_num = i // batch_size + 1
            total_batches = (total_records + batch_size - 1) // batch_size
            
            print(f"Uploading batch {batch_num}/{total_batches} ({len(batch)} records)...")
            index.upsert_records(config['namespace'], batch)
            
            # Small delay between batches to avoid rate limits
            if batch_num < total_batches:
                time.sleep(2)
        
        print("All records uploaded successfully")
        
        # Wait for the upserted vectors to be indexed
        print("Waiting for indexing to complete...")
        time.sleep(10)
        
        # View stats for the index
        stats = index.describe_index_stats()
        print("Upload Statistics:")
        print(f"  Total vectors: {stats.get('total_vector_count', 0)}")
        print(f"  Namespace '{config['namespace']}': {stats.get('namespaces', {}).get(config['namespace'], {}).get('vector_count', 0)} vectors")
        print(f"  Dimension: {stats.get('dimension', 'unknown')}")
        print(f"  Index fullness: {stats.get('index_fullness', 0):.1%}")
        
        print("Upload complete!")
        
    except Exception as e:
        print(f"Error during upload: {e}")
        raise

def test_search(query_text: str = "Canadian AI governance regulation") -> None:
    """Test search functionality."""
    config = {
        'index_name': os.getenv("PINECONE_INDEX_NAME", "network-graph"),
        'namespace': os.getenv("PINECONE_NAMESPACE", "example-namespace"),
    }
    
    pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
    index = pc.Index(config['index_name'])
    
    print(f"\nTesting search with query: '{query_text}'")
    
    try:
        # Search the index
        results = index.search(
            namespace=config['namespace'],
            query={
                "top_k": 5,
                "inputs": {
                    'text': query_text
                }
            }
        )
        
        # Print the results
        print("Search Results:")
        for hit in results['result']['hits']:
            print(f"  ID: {hit['_id']:<10} | Score: {hit['_score']:.3f} | Category: {hit['fields']['category']:<10}")
            print(f"       Text: {hit['fields']['chunk_text'][:100]}...")
            print()
            
    except Exception as e:
        print(f"Search test failed: {e}")

def truncate_record_if_needed(record: Dict[str, Any], max_size_bytes: int = 40000) -> Dict[str, Any]:
    """Truncate record fields if the overall record size exceeds the maximum allowed size."""
    import json
    
    # Make a copy of the record to avoid modifying the original
    truncated_record = record.copy()
    
    # Check the current size
    record_size = len(json.dumps(truncated_record).encode('utf-8'))
    
    # If the record is already within the size limit, return it as is
    if record_size <= max_size_bytes:
        return truncated_record
    
    print(f"Truncating record {record['_id']} from {record_size} bytes")
    
    # Fields to truncate in order of priority (least important first)
    fields_to_truncate = ['content', 'chunk_text', 'summary']
    
    # Truncate fields one by one until the record size is within the limit
    for field in fields_to_truncate:
        if field in truncated_record and isinstance(truncated_record[field], str):
            # Start with a significant truncation to avoid multiple iterations
            while record_size > max_size_bytes and len(truncated_record[field]) > 100:
                # Truncate the field by half each time
                truncated_length = len(truncated_record[field]) // 2
                truncated_record[field] = truncated_record[field][:truncated_length] + " [TRUNCATED]"
                
                # Recalculate the record size
                record_size = len(json.dumps(truncated_record).encode('utf-8'))
                
                print(f"  - Truncated '{field}' to {len(truncated_record[field])} chars, new record size: {record_size} bytes")
                
                # If we're now within the limit, break out of the loop
                if record_size <= max_size_bytes:
                    break
    
    # Final check
    final_size = len(json.dumps(truncated_record).encode('utf-8'))
    if final_size > max_size_bytes:
        print(f"WARNING: Record {record['_id']} is still too large ({final_size} bytes) after truncation")
    else:
        print(f"Successfully truncated record {record['_id']} to {final_size} bytes")
    
    return truncated_record

def main():
    """Main function to upload Canadian AI governance data to Pinecone."""
    # Validate and truncate records if needed
    validated_records = []
    for record in canadian_records:
        validated_record = validate_record(record)
        # Truncate the record if it's too large
        truncated_record = truncate_record_if_needed(validated_record)
        validated_records.append(truncated_record)
    
    try:
        # Upload data to Pinecone
        upsert_records_to_pinecone(validated_records)
        
        # Test search functionality with relevant Canadian AI governance queries
        test_search("OSFI model risk management")
        test_search("Canadian AI regulation")
        test_search("AIDA legislation")
        
    except Exception as e:
        print(f"Upload failed: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())